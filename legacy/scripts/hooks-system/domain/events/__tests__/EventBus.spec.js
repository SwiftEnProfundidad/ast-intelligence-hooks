const { EventBus, DomainEvent } = require('..');

describe('EventBus', () => {
    test('no reprocesa eventos duplicados (idempotencia por id)', async () => {
        const bus = new EventBus();
        const handled = [];
        bus.subscribe('TEST_EVENT', async (evt) => {
            handled.push(evt.id);
        });

        const evt = new DomainEvent('TEST_EVENT', { foo: 'bar' });
        await bus.publish(evt);
        await bus.publish(evt); // segunda vez mismo id

        expect(handled).toHaveLength(1);
        expect(handled[0]).toBe(evt.id);
    });

    test('recorta processedIds al superar maxProcessed', async () => {
        const bus = new EventBus();
        bus.maxProcessed = 3;
        bus.subscribe('*', async () => { });

        const idsBefore = [];
        for (let i = 0; i < 5; i++) {
            const evt = new DomainEvent('TEST_EVENT', { seq: i });
            idsBefore.push(evt.id);
            await bus.publish(evt);
        }

        expect(bus.processedIds.size).toBeLessThanOrEqual(bus.maxProcessed);
    });
});
