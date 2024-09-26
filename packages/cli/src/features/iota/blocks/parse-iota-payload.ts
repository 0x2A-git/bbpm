import { Block, hexToUtf8 } from '@iota/sdk';

function parseIotaPayload(
  block: Block,
  key: 'data' | 'signature' | null = null
) {
  const payload: any = block.payload;
  if (!payload) {
    throw new Error('Block payload seems empty');
  }
  const data: any = payload['data'];
  const utfPayload = hexToUtf8(data);

  return key ? JSON.parse(utfPayload)[key] : JSON.parse(utfPayload);
}

export { parseIotaPayload };
