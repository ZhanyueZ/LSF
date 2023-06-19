import { inject, observer } from 'mobx-react';
import { Button } from '../../common/Button/Button';
import { Tooltip } from '../../common/Tooltip/Tooltip';
import { Block, Elem } from '../../utils/bem';
import { isDefined } from '../../utils/utilities';
import { IconBan } from '../../assets/icons';

import './Controls.styl';
import { useCallback, useMemo, useState } from 'react';

const TOOLTIP_DELAY = 0.8;

const ButtonTooltip = inject('store')(observer(({ store, title, children }) => {
  return (
    <Tooltip
      title={title}
      enabled={store.settings.enableTooltips}
      mouseEnterDelay={TOOLTIP_DELAY}
    >
      {children}
    </Tooltip>
  );
}));

const controlsInjector = inject(({ store }) => {
  return {
    store,
    history: store?.annotationStore?.selected?.history,
  };
});

export const Controls = controlsInjector(observer(({ store, history, annotation }) => {
  const isReview = store.hasInterface('review');
  
  const historySelected = isDefined(store.annotationStore.selectedHistory);
  const { userGenerate, sentUserGenerate, versions, results, editable: annotationEditable } = annotation;
  const buttons = [];

  const [isInProgress, setIsInProgress] = useState(false);

  const disabled = !annotationEditable || store.isSubmitting || historySelected || isInProgress;
  const submitDisabled = store.hasInterface('annotations:deny-empty') && results.length === 0;
  
  const buttonHandler = useCallback(async (e, callback, tooltipMessage) => {
    const { addedCommentThisSession, currentComment, commentFormSubmit } = store.commentStore;
    
    if (isInProgress) return;
    setIsInProgress(true);
    if(addedCommentThisSession){
      callback();
    } else if((currentComment ?? '').trim()) {
      e.preventDefault();
      await commentFormSubmit();
      callback();
    } else {
      store.commentStore.setTooltipMessage(tooltipMessage);
    }
    setIsInProgress(false);
  }, [
    store.rejectAnnotation, 
    store.skipTask, 
    store.commentStore.currentComment, 
    store.commentStore.commentFormSubmit, 
    store.commentStore.addedCommentThisSession,
    isInProgress,
  ]);

  const RejectButton = useMemo(() => {
    return (
      <ButtonTooltip key="reject" title="拒绝标注: [ Ctrl+Space ]">
        <Button aria-label="reject-annotation" disabled={disabled} onClick={async (e)=> {
          if(store.hasInterface('comments:reject') ?? true) {
            buttonHandler(e, () => store.rejectAnnotation({}), '请在拒绝前输入评论');
          } else {
            console.log('rejecting');
            await store.commentStore.commentFormSubmit();
            store.rejectAnnotation({});
          }
        }}>
          拒绝
        </Button>
      </ButtonTooltip>
    );
  }, [disabled, store]);

  if (isReview) {
    buttons.push(RejectButton);

    buttons.push(
      <ButtonTooltip key="accept" title="接受标注: [ Ctrl+Enter ]">
        <Button aria-label="accept-annotation" disabled={disabled} look="primary" onClick={async () => {
          await store.commentStore.commentFormSubmit();
          store.acceptAnnotation();
        }}>
          {history.canUndo ? '修复+接受' : '接受'}
        </Button>
      </ButtonTooltip>,
    );
  } else if (annotation.skipped) {
    buttons.push(
      <Elem name="skipped-info" key="skipped">
        <IconBan color="#d00" /> 被跳过
      </Elem>);
    buttons.push(
      <ButtonTooltip key="cancel-skip" title="Cancel skip: []">
        <Button aria-label="cancel-skip" disabled={disabled} look="primary" onClick={async () => {
          await store.commentStore.commentFormSubmit();
          store.unskipTask();
        }}>
          取消跳过
        </Button>
      </ButtonTooltip>,
    );
  } else {
    if (store.hasInterface('skip')) {
      buttons.push(
        <ButtonTooltip key="skip" title="Cancel (skip) task: [ Ctrl+Space ]">
          <Button aria-label="skip-task" disabled={disabled} onClick={async (e)=> {
            if(store.hasInterface('comments:skip') ?? true) {
              buttonHandler(e, () => store.skipTask({}), '请在跳过前输入评论');
            } else {
              await store.commentStore.commentFormSubmit();
              store.skipTask({});
            }
          }}>
            跳过
          </Button>
        </ButtonTooltip>,
      );
    }

    const look = (disabled || submitDisabled) ? 'disabled' : 'primary';

    if ((userGenerate && !sentUserGenerate) || (store.explore && !userGenerate && store.hasInterface('submit'))) {
      const title = submitDisabled
        ? '此项目中的空注释被拒绝'
        : '保存结果: [ Ctrl+Enter ]';
      // span is to display tooltip for disabled button

      buttons.push(
        <ButtonTooltip key="submit" title={title}>
          <Elem name="tooltip-wrapper">
            <Button aria-label="submit" disabled={disabled || submitDisabled} look={look} onClick={async () => {
              await store.commentStore.commentFormSubmit();
              store.submitAnnotation();
            }}>
              提交
            </Button>
          </Elem>
        </ButtonTooltip>,
      );
    }

    if ((userGenerate && sentUserGenerate) || (!userGenerate && store.hasInterface('update'))) {
      const isUpdate = sentUserGenerate || versions.result;
      const button = (
        <ButtonTooltip key="update" title="更新此任务: [ Alt+Enter ]">
          <Button aria-label="submit" disabled={disabled || submitDisabled} look={look} onClick={async () => {
            await store.commentStore.commentFormSubmit();
            store.updateAnnotation();
          }}>
            {isUpdate ? '更新' : '提交'}
          </Button>
        </ButtonTooltip>
      );

      buttons.push(button);
    }
  }

  return (
    <Block name="controls">
      {buttons}
    </Block>
  );
}));
