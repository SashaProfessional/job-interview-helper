import { useNavigate } from 'react-router-dom';

import { sendToIPC } from '../shared/utils/ipc';
import { ROUTES } from '../shared/enums/routes';
import { IPCChannels } from '../shared/enums/ipcChannels';
import Button from '../components/Button';
import InteractiveArea from '../components/InteractiveArea';

const MainPage = () => {
  const navigate = useNavigate();

  const onStartSessionClick = () => {
    sendToIPC(IPCChannels.RM_SET_IGNORE_MOUSE_EVENTS, false);
    navigate(ROUTES.LISTENING);
  };

  return (
    <div className="page-wrapper">
      <InteractiveArea className="page main-page">
        <div className="header">
          <Button onClick={() => navigate(ROUTES.SETTINGS)}>Settings</Button>
          <Button onClick={() => sendToIPC(IPCChannels.RM_CLOSE_APP)}>X</Button>
        </div>
        <div className="footer">
          <Button onClick={onStartSessionClick}>Start Session</Button>
        </div>
      </InteractiveArea>
    </div>
  );
};

export default MainPage;
