import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '../shared/enums/routes';
import { IPCChannels } from '../shared/enums/ipcChannels';
import { sendToIPC } from '../shared/utils/ipc';
import Button from '../components/Button';
import InteractiveArea from '../components/InteractiveArea';

const SettingsPage = () => {
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  const navigate = useNavigate();

  const onSaveClick = async () => {
    setIsSaveLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await navigate(ROUTES.MAIN);
  };

  return (
    <div className="page-wrapper">
      <InteractiveArea className="page settings-page">
        <div className="header">
          <Button onClick={() => navigate(ROUTES.MAIN)}>Back</Button>
          <Button onClick={() => sendToIPC(IPCChannels.RM_CLOSE_APP)}>
            X
          </Button>
        </div>
        <div className="footer">
          <Button onClick={() => navigate(ROUTES.MAIN)}>Cancel</Button>
          <Button isLoading={isSaveLoading} onClick={onSaveClick}>
            Save
          </Button>
        </div>
      </InteractiveArea>
    </div>
  );
};

export default SettingsPage;
