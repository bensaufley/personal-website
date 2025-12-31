import clsx from 'clsx';
import dayjs, { type Dayjs, type OpUnitType } from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import { createMemo, mergeProps, splitProps } from 'solid-js';

import styles from './styles.module.css';

dayjs.extend(utcPlugin);

type Props = {
  format?: string;
  inline?: boolean;
  utc?: boolean;
  value: Date | Dayjs | number | string;
} & (
  | {
      truncate?: 'day' | 'hour' | 'minute' | null;
    }
  | {
      day: true;
    }
  | {
      hour: true;
    }
  | {
      minute: true;
    }
);

const Timestamp = (_props: Props) => {
  const baseProps = mergeProps({ format: 'D MMMM, YYYY', utc: true, inline: false }, _props);
  const [props, rest] = splitProps(baseProps, ['format', 'utc', 'inline', 'value']);
  const trunc = createMemo((): OpUnitType | null => {
    if ('truncate' in rest) return rest.truncate;
    if ('day' in rest) return 'day';
    if ('hour' in rest) return 'hour';
    if ('minute' in rest) return 'minute';
    return 'day';
  });
  const day = createMemo(() => {
    let val = props.utc ? dayjs.utc(props.value) : dayjs(props.value);
    const truncateUnit = trunc();
    if (truncateUnit) val = val.startOf(truncateUnit);
    return val;
  });

  return (
    <time class={clsx(styles.timestamp, props.inline && styles.inline)} dateTime={day().toISOString()}>
      {day().format(props.format)}
    </time>
  );
};

export default Timestamp;
