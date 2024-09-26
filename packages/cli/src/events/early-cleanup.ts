import EventEmitter from 'events';

const cleanUpEventEmitter = new EventEmitter();

const EARLY_CLEANUP_EVENT = 'early_cleanup';

export { cleanUpEventEmitter, EARLY_CLEANUP_EVENT };
