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

        return new Proxy(this, {
            get(target, prop) {
                if (typeof target[prop] === 'function' && Object.prototype.hasOwnProperty.call(target, prop)) {
                    return target[prop].bind(target);
                }

                if (prop === '_serviceFactory') return target._getServiceFactory();
                if (prop === '_adapterFactory') return target._getAdapterFactory();
                if (prop === '_monitorFactory') return target._getMonitorFactory();

                if (typeof prop === 'string' && prop.startsWith('get')) {
                    const serviceFactory = target._getServiceFactory();
                    if (serviceFactory && typeof serviceFactory[prop] === 'function') {
                        return serviceFactory[prop].bind(serviceFactory);
                    }

                    const adapterFactory = target._getAdapterFactory();
                    if (adapterFactory && typeof adapterFactory[prop] === 'function') {
                        return adapterFactory[prop].bind(adapterFactory);
                    }

                    const monitorFactory = target._getMonitorFactory();
                    if (monitorFactory && typeof monitorFactory[prop] === 'function') {
                        return monitorFactory[prop].bind(monitorFactory);
                    }
                }

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
            this._adapterFactory = new AdapterFactory(this.repoRoot, this.instances, null);
        }
        return this._adapterFactory;
    }

    _getServiceFactory() {
        if (!this._serviceFactory) {
            const adapterFactory = this._getAdapterFactory();
            this._serviceFactory = new ServiceFactory(this.repoRoot, this.instances, adapterFactory);
            try {
                if (adapterFactory && !adapterFactory.logger) {
                    adapterFactory.logger = this._serviceFactory.getLogger();
                }
            } catch (error) {
                const msg = error && error.message ? error.message : String(error);
                this._serviceFactory?.getLogger?.()?.debug?.('COMPOSITIONROOT_ADAPTER_LOGGER_BIND_FAILED', { error: msg });
            }
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
