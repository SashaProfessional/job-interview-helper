import { TCPDataType } from '../enums/tcpDataType';

export type ChunkHeaderType = {
  id: number;
  index: number;
  total: number;
  length: number;
  type: TCPDataType;
};
