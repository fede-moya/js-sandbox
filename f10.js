// @flow
import ACTION from '../work_action_constant';
 
const ats = (
  state: Object = {
    validateAts: {},
    atsData: {},
  },
  action: Object
) => {
  switch (action.type) {
    case ACTION.WORK.ATS.VALIDATE_ATS: {
      const { message, resStatus: status, ats_data: atsData } = action.data;
      return {
        ...state,
        validateAts: { message, status },
        atsData,
      };
    }
    default:
      return state;
  }
};
 
export default ats;
