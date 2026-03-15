export interface AddressRecord {
  id: string;
  name: string;
  phone: string;
  detail: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export const normalizeAddress = (raw: any): AddressRecord => ({
  id: raw && (raw.address_id || raw.id) ? String(raw.address_id || raw.id) : '',
  name: raw && raw.name ? String(raw.name) : '',
  phone: raw && raw.phone ? String(raw.phone) : '',
  detail:
    raw && raw.full_address
      ? String(raw.full_address)
      : [raw && raw.address ? String(raw.address) : '', raw && raw.detail ? String(raw.detail) : '']
          .filter(Boolean)
          .join(' ')
          .trim(),
  lat: raw && typeof raw.lat === 'number' ? raw.lat : undefined,
  lng: raw && typeof raw.lng === 'number' ? raw.lng : undefined,
  isDefault: !!(raw && (raw.is_default || raw.isDefault)),
});

export const normalizeAddresses = (value: any): AddressRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(normalizeAddress).filter((item) => !!item.id);
};
