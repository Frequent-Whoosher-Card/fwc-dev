import { apiFetch } from '../apiConfig';

/* =========================
   MEMBERSHIP SERVICE
========================= */

export const getMembers = () => {
  return apiFetch('/members');
};

export const getMemberById = (id: string | number) => {
  return apiFetch(`/members/${id}`);
};

export const createMember = (payload: any) => {
  return apiFetch('/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateMember = (
  id: string | number,
  payload: any
) => {
  return apiFetch(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteMember = (id: string | number) => {
  return apiFetch(`/members/${id}`, {
    method: 'DELETE',
  });
};
