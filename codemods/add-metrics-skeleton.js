const path = require('path');

function toSnakeCase(input) {
    return String(input)
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
}

function findOrCreateFirstFunctionBodyStatement(j, root) {
    // First reasonable insertion point:
    // - after 'use strict' if present
    // - after require declarations if present
    const body = root.get().node.program.body;
    let idx = 0;

    while (idx < body.length) {
        const node = body[idx];
        if (
            node.type === 'ExpressionStatement' &&
            node.expression &&
            node.expression.type === 'Literal' &&
            node.expression.value === 'use strict'
        ) {
            idx++;
            continue;
        }
        // Skip const X = require('...')
        if (
            node.type === 'VariableDeclaration' &&
            node.declarations &&
            node.declarations.length > 0
        ) {
            const decl = node.declarations[0];
            const init = decl && decl.init;
            if (
                init &&
                init.type === 'CallExpression' &&
                init.callee &&
                init.callee.type === 'Identifier' &&
                init.callee.name === 'require'
            ) {
                idx++;
                continue;
            }
        }
        break;
    }

    return idx;
}

function ensureMetricScopeImport(j, root) {
    const already = root
        .find(j.VariableDeclarator, {
            id: { type: 'ObjectPattern' },
            init: {
                type: 'CallExpression',
                callee: { type: 'Identifier', name: 'require' }
            }
        })
        .filter(p => {
            const init = p.node.init;
            const arg = init.arguments && init.arguments[0];
            return arg && arg.type === 'Literal' && String(arg.value).includes('metric-scope');
        });

    if (already.size() > 0) {
        return;
    }

    const insertIdx = findOrCreateFirstFunctionBodyStatement(j, root);
    const importDecl = j.variableDeclaration('const', [
        j.variableDeclarator(
            j.objectPattern([j.property('init', j.identifier('createMetricScope'), j.identifier('createMetricScope'))]),
            j.callExpression(j.identifier('require'), [
                j.literal('../../../infrastructure/telemetry/metric-scope')
            ])
        )
    ]);

    root.get().node.program.body.splice(insertIdx, 0, importDecl);
}

function makeMetricScopeIdentifier(j, methodName) {
    return j.identifier(`m_${toSnakeCase(methodName)}`);
}

function isMethodCandidate(name) {
    if (!name) return false;
    return (
        name === 'constructor' ||
        name === 'start' ||
        name === 'stop' ||
        name === 'run' ||
        name === 'execute' ||
        name === 'handle' ||
        name === 'process' ||
        name === 'syncBranches' ||
        /^create[A-Z_]/.test(name) ||
        /^get[A-Z_]/.test(name)
    );
}

function hasCreateMetricScopeAlready(j, methodPath) {
    return j(methodPath)
        .find(j.CallExpression, { callee: { name: 'createMetricScope' } })
        .size() > 0;
}

function hasRecordMetricAlready(j, methodPath) {
    return j(methodPath)
        .find(j.CallExpression, {
            callee: {
                type: 'Identifier',
                name: 'recordMetric'
            }
        })
        .size() > 0;
}

function prependStartedCall(j, body, metricIdent) {
    if (!body || body.type !== 'BlockStatement') return;
    const stmts = body.body || [];

    // Avoid double insertion
    const already = stmts.some(s =>
        s.type === 'ExpressionStatement' &&
        s.expression &&
        s.expression.type === 'CallExpression' &&
        s.expression.callee &&
        s.expression.callee.type === 'MemberExpression' &&
        s.expression.callee.object &&
        s.expression.callee.object.type === 'Identifier' &&
        s.expression.callee.object.name === metricIdent.name &&
        s.expression.callee.property &&
        s.expression.callee.property.type === 'Identifier' &&
        s.expression.callee.property.name === 'started'
    );
    if (already) return;

    stmts.unshift(
        j.expressionStatement(
            j.callExpression(j.memberExpression(metricIdent, j.identifier('started')), [])
        )
    );
}

function ensureSuccessBeforeReturns(j, body, metricIdent) {
    if (!body || body.type !== 'BlockStatement') return;

    j(body)
        .find(j.ReturnStatement)
        .forEach(p => {
            const parent = p.parent && p.parent.node;
            if (!parent) return;

            // Only handle direct statement lists (BlockStatement body)
            if (parent.type !== 'BlockStatement') return;

            const idx = parent.body.indexOf(p.node);
            if (idx < 0) return;

            const prev = parent.body[idx - 1];
            const isAlready =
                prev &&
                prev.type === 'ExpressionStatement' &&
                prev.expression &&
                prev.expression.type === 'CallExpression' &&
                prev.expression.callee &&
                prev.expression.callee.type === 'MemberExpression' &&
                prev.expression.callee.object &&
                prev.expression.callee.object.type === 'Identifier' &&
                prev.expression.callee.object.name === metricIdent.name &&
                prev.expression.callee.property &&
                prev.expression.callee.property.type === 'Identifier' &&
                prev.expression.callee.property.name === 'success';

            if (isAlready) return;

            parent.body.splice(
                idx,
                0,
                j.expressionStatement(
                    j.callExpression(j.memberExpression(metricIdent, j.identifier('success')), [])
                )
            );
        });
}

function ensureTerminalSuccess(j, body, metricIdent) {
    if (!body || body.type !== 'BlockStatement') return;
    const stmts = body.body || [];
    if (stmts.length === 0) return;

    const last = stmts[stmts.length - 1];

    // If last is return, we already inject before returns.
    if (last.type === 'ReturnStatement') return;

    // If last is a success call already, do nothing.
    if (
        last.type === 'ExpressionStatement' &&
        last.expression &&
        last.expression.type === 'CallExpression' &&
        last.expression.callee &&
        last.expression.callee.type === 'MemberExpression' &&
        last.expression.callee.object &&
        last.expression.callee.object.type === 'Identifier' &&
        last.expression.callee.object.name === metricIdent.name &&
        last.expression.callee.property &&
        last.expression.callee.property.type === 'Identifier' &&
        last.expression.callee.property.name === 'success'
    ) {
        return;
    }

    stmts.push(
        j.expressionStatement(
            j.callExpression(j.memberExpression(metricIdent, j.identifier('success')), [])
        )
    );
}

function insertScopeAndStarted(j, fnBody, metricIdent, hook, operation) {
    if (!fnBody || fnBody.type !== 'BlockStatement') {
        return;
    }

    const scopeDecl = j.variableDeclaration('const', [
        j.variableDeclarator(
            metricIdent,
            j.callExpression(j.identifier('createMetricScope'), [
                j.objectExpression([
                    j.property('init', j.identifier('hook'), j.literal(hook)),
                    j.property('init', j.identifier('operation'), j.literal(operation))
                ])
            ])
        )
    ]);

    // Declare scope first
    fnBody.body.unshift(scopeDecl);

    // Then call started() immediately after declaration
    fnBody.body.splice(
        1,
        0,
        j.expressionStatement(
            j.callExpression(j.memberExpression(metricIdent, j.identifier('started')), [])
        )
    );
}

module.exports = function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const fileBase = path.basename(file.path, path.extname(file.path));
    const hook = toSnakeCase(fileBase);

    ensureMetricScopeImport(j, root);

    // Instrument class methods
    root.find(j.MethodDefinition).forEach(p => {
        const key = p.node.key;
        const methodName = key && key.type === 'Identifier' ? key.name : null;
        if (!isMethodCandidate(methodName)) {
            return;
        }

        const fn = p.node.value;
        if (!fn || !fn.body) {
            return;
        }

        // Skip if already instrumented
        if (hasCreateMetricScopeAlready(j, p) || hasRecordMetricAlready(j, p)) {
            return;
        }

        const metricIdent = makeMetricScopeIdentifier(j, methodName);

        insertScopeAndStarted(j, fn.body, metricIdent, hook, toSnakeCase(methodName));

        // Ensure success before returns and at end
        ensureSuccessBeforeReturns(j, fn.body, metricIdent);
        ensureTerminalSuccess(j, fn.body, metricIdent);
    });

    return root.toSource({ quote: 'single' });
};
