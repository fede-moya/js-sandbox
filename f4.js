//@flow weak
import ACTION from '../community_action_constant';
/* istanbul ignore next */
function badges(
  state = {
    badge: {},
    trackChapterBadgeMapping: {},
    badgeToTracksMap: {},
  },
  action
) {
  switch (action.type) {
    case ACTION.APP.PREFETCH_DATA: {
      const { trackChapterBadgeMapping } = action.data;
      const badgeToTracksMap = {};
 
      if (trackChapterBadgeMapping) {
        Object.entries(trackChapterBadgeMapping).forEach(([trackSLug, badgeSlugs]) => {
          badgeSlugs.forEach((badgeSlug) => {
            if (!badgeToTracksMap[badgeSlug]) badgeToTracksMap[badgeSlug] = [];
            badgeToTracksMap[badgeSlug].push(trackSLug);
          });
        });
      }
 
      return {
        ...state,
        trackChapterBadgeMapping: {
          ...state.trackChapterBadgeMapping,
          ...trackChapterBadgeMapping,
        },
        badgeToTracksMap,
      };
    }
    case ACTION.BADGES.LOAD_BADGE_PROGRESS: {
      const { badgeType, progress } = action.data;
      return {
        ...state,
        badge: {
          ...state.badge,
          [badgeType]: progress,
        },
      };
    }
    case ACTION.SUBMISSION.SUBMIT_CHALLENGE:
    case ACTION.SUBMISSION.LOAD_SUBMISSION_DETAIL: {
      const { badges } = action.data.submission;
      if (!badges) return state;
 
      const newBadgesData = {};
      badges.forEach((badge) => {
        newBadgesData[badge.badge_type] = badge;
      });
 
      return {
        ...state,
        badge: {
          ...state.badge,
          ...newBadgesData,
        },
      };
    }
    default:
      return state;
  }
}
 
export default badges;
