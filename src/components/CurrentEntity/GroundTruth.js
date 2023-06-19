import { observer } from 'mobx-react';
import { LsStar, LsStarOutline } from '../../assets/icons';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { BemWithSpecifiContext } from '../../utils/bem';
import { FF_DEV_3873, isFF } from '../../utils/feature-flags';
import './GroundTruth.styl';

const { Block, Elem } = BemWithSpecifiContext();

export const GroundTruth = observer(({ entity, disabled = false, size = 'md' }) => {
  const title = entity.ground_truth
    ? '将此结果取消设置为正确基准值（ground truth）'
    : '将此结果设定为正确基准值（ground truth）';

  return (!entity.skipped && !entity.userGenerate && entity.type !== 'prediction') && (
    <Block name="ground-truth" mod={{ disabled, size }}>
      <Tooltip placement="topLeft" title={title}>
        <Elem
          tag={Button}
          name="toggle"
          size="small"
          type="link"
          onClick={ev => {
            ev.preventDefault();
            entity.setGroundTruth(!entity.ground_truth);
          }}
        >
          <Elem
            name="indicator"
            tag={isFF(FF_DEV_3873) && !entity.ground_truth ? LsStarOutline : LsStar}
            mod={{ active: entity.ground_truth, dark: isFF(FF_DEV_3873) }}
          />
        </Elem>
      </Tooltip>
    </Block>
  );
});
