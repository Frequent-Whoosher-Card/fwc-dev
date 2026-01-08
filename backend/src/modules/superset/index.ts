import { Elysia } from 'elysia';
import { SupersetService } from './service';

export const superset = new Elysia({ prefix: '/superset' }).get('/guest-token', async ({ query, set }) => {
  try {
    const dashboardId = query.dashboardId as string;

    if (!dashboardId) {
      set.status = 400;
      return {
        success: false,
        message: 'dashboardId required',
      };
    }

    const token = await SupersetService.createGuestToken(dashboardId);

    return {
      success: true,
      token,
    };
  } catch (err: any) {
    console.error('[SUPERSET ERROR]', err);

    set.status = 500;
    return {
      success: false,
      message: err?.message ?? 'Superset guest token failed',
    };
  }
});
