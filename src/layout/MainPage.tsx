import { useNavigate } from 'react-router-dom';

import { ROUTES } from '../shared/enums/routes';
import { IPCChannels } from '../shared/enums/ipcChannels';
import Button from '../components/Button';
import InteractiveArea from '../components/InteractiveArea';
import { sendIPCMessage } from '../shared/utils/sendIPCMessage';

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <InteractiveArea className="page main-page">
        <div className="header">
          <Button onClick={() => navigate(ROUTES.SETTINGS)}>Settings</Button>
          <Button onClick={() => sendIPCMessage(IPCChannels.CLOSE_APP)}>
            X
          </Button>
        </div>
        <div className="footer">
          <Button onClick={() => navigate(ROUTES.LISTENING)}>
            Start Session
          </Button>
        </div>
      </InteractiveArea>
    </div>
  );
};

export default MainPage;
