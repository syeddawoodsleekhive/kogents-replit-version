import { createQueueProvider } from '../../common/queues/queue-factory';

export const fileProcessingQueueProvider = createQueueProvider(
    'FILE_PROCESSING_QUEUE',
    'file-processing',
);