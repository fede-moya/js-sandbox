import { getPatchData } from 'hr-util/route_utils';
 
export function handleRouteLoad(nextState, replace, cb) {
  const { store } = getPatchData(nextState);
  const state = store.getState();
 
  const {
    profile: { is_admin },
  } = state.community;
 
  if (!is_admin) {
    replace('/');
    cb();
    return;
  }
  cb();
}
 
const AdminRoutes = [
  {
    path: 'superadmin',
    name: 'superadmin',
    pageViewId: 'SuperAdminView',
    onEnter: handleRouteLoad,
    communityHeader: false,
    getComponents(nextState, cb) {
      hrImport(
        (require) => {
          const Admin = require('./admin').default;
          cb(null, Admin);
        },
        cb,
        'hackerrank_r_admin',
        {
          nextState,
        }
      );
    },
    indexRoute: {
      onEnter: function (nextState, replace, cb) {
        replace('/superadmin/su');
        cb();
      },
    },
    childRoutes: [
Similar blocks of code found in 3 locations. Consider refactoring.
      {
        path: 'su',
        name: 'SwithUser',
        getComponents(nextState, cb) {
          hrImport(
            (require) => {
              const AdminSwitchUser = require('./admin_switch_user').default;
              cb(null, AdminSwitchUser);
            },
            cb,
            'hackerrank_r_admin',
            {
              nextState,
            }
          );
        },
      },
Similar blocks of code found in 3 locations. Consider refactoring.
      {
        path: 'upload',
        name: 'Upload',
        getComponents(nextState, cb) {
          hrImport(
            (require) => {
              const AdminUpload = require('./admin_upload').default;
              cb(null, AdminUpload);
            },
            cb,
            'hackerrank_r_admin',
            {
              nextState,
            }
          );
        },
      },
    ],
  },
];
 
export default AdminRoutes;
