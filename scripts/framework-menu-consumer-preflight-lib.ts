import { formatConsumerPreflight } from './framework-menu-consumer-preflight-render';
import { runConsumerPreflight } from './framework-menu-consumer-preflight-run';

export type {
  ConsumerPreflightDependencies,
  ConsumerPreflightRenderOptions,
  ConsumerPreflightResult,
  ConsumerPreflightStage,
} from './framework-menu-consumer-preflight-types';
export { formatConsumerPreflight, runConsumerPreflight };

export default {
  runConsumerPreflight,
  formatConsumerPreflight,
};
