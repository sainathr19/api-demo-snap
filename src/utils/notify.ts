export const sendNotifications = async () => {
  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'native',
      message: 'Swap Successfull',
    },
  });
  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'inApp',
      message: 'Swap Successfull',
    },
  });
};
