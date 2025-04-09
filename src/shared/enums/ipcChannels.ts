export enum IPCChannels {
  //renderer to main
  RM_CLOSE_APP = 'rm-close-app',
  RM_LOG_TO_MAIN = 'rm-log-to-main',
  RM_SET_IGNORE_MOUSE_EVENTS = 'rm-set-ignore-mouse-events',
  RM_SEND_TCP_MESSAGE = 'rm-send-tcp-message',

  //main to renderer
  MR_TEXT_BLOCK_RECEIVED = 'mr-text-block-received',

  //main to main
  MM_TCP_TEXT_BLOCK_RECEIVED = 'mm-tcp-text-block-received',
}
