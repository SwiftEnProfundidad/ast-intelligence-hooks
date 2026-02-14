describe('events', () => {
    describe('EventListeners', () => {
        it('should export class', () => {
            const EventListeners = require('../EventListeners');
            expect(EventListeners).toBeDefined();
        });

        it('should be instantiable', () => {
            const EventListeners = require('../EventListeners');
            const instance = new EventListeners({}, '/tmp');
            expect(instance).toBeDefined();
        });
    });
});
