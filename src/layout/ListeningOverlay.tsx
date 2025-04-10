import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IPCChannels } from '../shared/enums/ipcChannels';
import { ROUTES } from '../shared/enums/routes';
import { TextBlock } from '../shared/types/TextBlock';
import { sendToIPC, subscribeOnIPC } from '../shared/utils/ipc';
import SpeechListener from '../components/SpeechListener';
import InteractiveArea from '../components/InteractiveArea';
import Button from '../components/Button';
import { getTextBlockMock, textBlocksMock } from '../mocks/TextBlocks';

const ListeningOverlay = () => {
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([
    textBlocksMock[0],
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeOnIPC(
      IPCChannels.MR_TEXT_BLOCK_RECEIVED,
      (textBlock: TextBlock) => {
        console.log('📩 Renderer received TCP message:', textBlock);

        setTextBlocks((prev) => [
          { ...textBlock, id: prev.length + 1 }, //temp
          ...prev,
        ]);
      },
    );

    sendToIPC(IPCChannels.RM_SET_IGNORE_MOUSE_EVENTS, true);

    return () => unsubscribe?.();
  }, []);

  const onPushTextBlock = () =>
    setTextBlocks((prev) => [getTextBlockMock(prev.length + 1), ...prev]);

  const onSendTCPMessage = () =>
    sendToIPC(IPCChannels.RM_SEND_TCP_MESSAGE, 'TCP Message from React Layer');

  const onSendTCPScreenshot = () =>
    sendToIPC(IPCChannels.RM_SEND_TCP_SCREENSHOT);

  return (
    <div className="listening-overlay">
      <div className="main-block block">
        {textBlocks.map((tb) => (
          <div key={tb.id} className="text-block">
            {tb.header && (
              <div className="header">
                {tb.header} ({tb.id})
              </div>
            )}
            <div className="body">{tb.body}</div>
          </div>
        ))}
      </div>
      <div className="legend-block block">
        <div className="item">Ctrl+Q&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;Quit</div>
        <div className="item">
          Ctrl+?&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;Lorem Ipsum
        </div>
        <div className="item">
          Ctrl+?&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;Lorem Ipsum
        </div>
      </div>

      <InteractiveArea className="dev-block block">
        <div className="buttons-group">
          <Button onClick={onPushTextBlock}>Push Text Block</Button>
          <Button onClick={onSendTCPMessage}>Send TCP Message</Button>
          <Button onClick={onSendTCPScreenshot}>Send TCP Screenshot</Button>
          <Button onClick={() => navigate(ROUTES.MAIN)}>End Session</Button>
        </div>
      </InteractiveArea>

      <SpeechListener />
    </div>
  );
};

export default ListeningOverlay;
