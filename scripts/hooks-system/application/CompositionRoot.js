const AdapterFactory = require('./factories/AdapterFactory');
const ServiceFactory = require('./factories/ServiceFactory');
const MonitorFactory = require('./factories/MonitorFactory');
const path = require('path');
const fs = require('fs');

class CompositionRoot {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.instances = new Map();

        // Ensure audit directories exist
        this.auditDir = path.join(repoRoot, '.audit-reports');
        this.tempDir = path.join(repoRoot, '.audit_tmp');
        this._ensureDirectories([this.auditDir, this.tempDir]);

        // Initialize factories lazily
        this._adapterFactory = null;
        this._serviceFactory = null;
        this._monitorFactory = null;

        // Create dynamic proxy for automatic delegation
        return new Proxy(this, {
            get(target, prop) {
                // If method exists in CompositionRoot, use it
                if (typeof target[prop] === 'function' && target.hasOwnProperty(prop)) {
                    return target[prop].bind(target);
                }

                // Delegate to specialized factories
                if (target._serviceFactory && typeof target._serviceFactory[prop] === 'function') {
                    return target._serviceFactory[prop].bind(target._serviceFactory);
                }
                if (target._adapterFactory && typeof target._adapterFactory[prop] === 'function') {
                    return target._adapterFactory[prop].bind(target._adapterFactory);
                }
                if (target._monitorFactory && typeof target._monitorFactory[prop] === 'function') {
                    return target._monitorFactory[prop].bind(target._monitorFactory);
                }

                // Para acceso a propiedades de factories
                if (prop === '_serviceFactory') return target._serviceFactory;
                if (prop === '_adapterFactory') return target._adapterFactory;
                if (prop === '_monitorFactory') return target._monitorFactory;

                return target[prop];
            }
        });
    }

    _ensureDirectories(dirs) {
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    _getAdapterFactory() {
        if (!this._adapterFactory) {
            this._adapterFactory = new AdapterFactory(this.repoRoot, this.instances, this.getLogger());
        }
        return this._adapterFactory;
    }

    _getServiceFactory() {
        if (!this._serviceFactory) {
            this._serviceFactory = new ServiceFactory(this.repoRoot, this.instances, this._getAdapterFactory());
        }
        return this._serviceFactory;
    }

    _getMonitorFactory() {
        if (!this._monitorFactory) {
            this._monitorFactory = new MonitorFactory(this.repoRoot, this.instances, this._getServiceFactory());
        }
        return this._monitorFactory;
    }

    // Essential methods that are not delegated
    getLogger() {
        return this._getServiceFactory().getLogger();
    }

    getMonitors() {
        return this._getMonitorFactory().getMonitors();
    }

    getRealtimeGuardService() {
        const monitors = this.getMonitors();
        return this._getServiceFactory().getRealtimeGuardService(monitors);
    }

    // MCP Protocol Handler (kept here as it's specific to MCP infrastructure)
    getMcpProtocolHandler(inputStream, outputStream) {
        const McpProtocolHandler = require('../infrastructure/mcp/services/McpProtocolHandler');
        const logger = this.getLogger();
        return new McpProtocolHandler(inputStream, outputStream, logger);
    }

    static createForProduction(repoRoot) {
        return new CompositionRoot(repoRoot);
    }

    static createForTesting(repoRoot, overrides = {}) {
        const root = new CompositionRoot(repoRoot);
        if (overrides) {
            Object.entries(overrides).forEach(([key, value]) => {
                root.instances.set(key, value);
            });
        }
        return root;
    }
}

module.exports = CompositionRoot;
