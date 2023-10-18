//@flow weak
import React from 'react';
import { bindActionCreators } from 'redux';
 
import AtsRoutes from './ats/ats_routes';
import TeamsRoutes from './teams/teams_routes';
 
import manifestActions from 'app-server/actions/manifest_actions';
import { getPatchData } from 'hr-util/route_utils';
import { isTrialBannerShown } from './util/ftux_util';
import {
  isLoggedOut,
  isCovidBannerShown,
  isAttemptsBannerShown,
  isLockedTrial,
  isPauseScheduled,
  isInterviewPromoBannerShown,
} from './util/user_util';
 
import Work from './work';
import TestsRoutes from './tests/tests_routes';
import CompetitionRoutes from './competitions/competition_routes';
import LibraryRoutes from './library/library_routes';
import ProjectsRoutes from './projects/projects';
import QuestionRoutes from './questions/question_routes';
import SettingsRoutes from './settings/settings_routes';
import AdminRoutes from './admin/admin_routes';
import PricingRoutes from './pricing/pricing_routes';
import SubscriptionRoutes from './subscription/subscription_routes';
import ChangePlanRoutes from './subscription/change-plan/change-plan_routes';
import CandidateRoutes from './candidate/candidate_routes';
import IframeableRoutes from './iframeable/iframeable_routes';
import RolesRoutes from './skills/roles_routes';
import PacketRoutes from './packet/packet_routes';
import HomepageRoutes from './homepage/homepage_routes';
import InterviewsRoutes from './interviews/interviews_routes';
import { ValidateReplyToEmailRoute } from './validate_reply_to_email/validate_reply_to_email_routes';
 
import PageNotFound from './common_components/page_not_found/page_not_found';
import InsightsRoutes from './insights/insights_routes';
import { QuestionsDownloadRoute } from './tests/questions/download/questions_download_route';
import { ReportDownloadRoute } from 'work/attempt_report/download/report_download_route';
import { isDownloadRoute } from './util/route_util';
import ValidateReplyToEmail from './validate_reply_to_email/validate_reply_to_email';
import { prefetchWorkFeatureFlags } from './feature_flags/feature_flags_action';
 
export const PageNotFoundRoute = {
  path: '404',
  name: 'pageNotFound',
  component: PageNotFound,
};
 
export const redirectToLogin = (nextState, replace, cb) => {
  const { pathname, search } = nextState.location;
  replace(`/work/login?redirect=${pathname}${encodeURIComponent(search)}`);
  cb();
};
 
export const isDownloadReportRoute = (location, params) => {
  return Boolean(location.pathname.endsWith('/download') && params.attemptId && params.testId);
};
 
const WorkRoute = [
  {
    path: 'work',
    name: 'work',
    className: function ({ store, location }) {
      const state = store.getState();
      const {
        work: { user },
        metadata: {
          applicationConstants: { content_service_migration },
        },
      } = state;
      const { pathname } = location;
      let className = '';
      const loggedOut = isLoggedOut(user);
      const contentServiceMigration = loggedOut ? false : content_service_migration;
 
      if (isTrialBannerShown(user, pathname) && contentServiceMigration) {
        className = 'show-work-content-banner';
      } else if (isTrialBannerShown(user, pathname) || isInterviewPromoBannerShown(user)) {
        className = 'show-work-banner';
      } else if (isCovidBannerShown(state, user)) {
        className = 'show-work-covid-banner';
      } else if (isAttemptsBannerShown(user)) {
        className = 'show-work-attempts-banner';
      } else if (isPauseScheduled(user) && pathname !== '/work/settings/billing') {
        className = 'show-work-banner';
      }
 
      return className;
    },
    onEnter: function (nextState, replace, cb) {
      const { store, fullManifest, ajaxServerConf } = getPatchData(nextState);
 
      const actions = bindActionCreators(
        {
          prefetchWorkFeatureFlags,
          loadManifest: manifestActions.loadManifest,
        },
        store.dispatch
      );
 
      const { user } = store.getState().work;
      const loggedOut = isLoggedOut(user);
      const pathname = nextState.location.pathname;
      const isHomeRoute = pathname.startsWith('/work/home');
      const isValidateReplyToEmailRoute = pathname.startsWith('/work/validate_reply_to_email');
      const isPricingRoute = pathname.startsWith('/work/pricing-plans');
 
      if (isValidateReplyToEmailRoute) {
        cb();
      } else if (loggedOut && !isDownloadRoute(nextState.location)) {
        redirectToLogin(nextState, replace, cb);
      } else if (isLockedTrial(user) && !isHomeRoute && !isPricingRoute) {
        replace('/work/home');
        cb();
      } else {
        /* We're not fetching feature flags
            1. when the page is validate_reply_to_email
            2. When a locked user access pages other than home or pricing page
            3. When the page is a download report route
        */
        // set sourcing cookie
 
        const promises = [];
 
        if (!isDownloadReportRoute(nextState.location, nextState.params)) {
          promises.push(actions.prefetchWorkFeatureFlags(ajaxServerConf));
        }
 
        // Load manifest data
        promises.push(
          actions.loadManifest({
            bundles: ['hackerrank_r_work.js'],
            fullManifest,
          })
        );
 
        Promise.all(promises)
          .then(() => cb())
          .catch((err) => cb(err));
      }
    },
    onChange: function (prevState, nextState, replace) {
      const { store } = getPatchData(nextState);
      const state = store.getState();
      const { user } = state.work;
      const pathname = nextState.location.pathname;
      const isHomeRoute = pathname.startsWith('/work/home');
      const isPricingRoute = pathname.startsWith('/work/pricing-plans');
 
      if (isLockedTrial(user) && !isHomeRoute && !isPricingRoute) {
        replace('/work/home');
      }
    },
    getComponents(nextState, cb) {
      /* This is required to sim older behaviour to rerender component on route change **/
      /** TODO: Fix all component to remove side-effect or url change */
      const pathname = nextState.location.pathname;
 
      const isRolesRoutes = pathname.startsWith('/work/roles');
      if (isRolesRoutes) {
        cb(null, Work);
        return;
      }
 
      const isValidateReplyToEmailRoute = pathname.startsWith('/work/validate_reply_to_email');
      if (isValidateReplyToEmailRoute) {
        cb(null, ValidateReplyToEmail);
        return;
      }
 
      function Component(props) {
        return <Work {...props} />;
      }
      cb(null, Component);
    },
 
    childRoutes: [
      ...InsightsRoutes,
      ...TestsRoutes,
      ...CompetitionRoutes,
      ...LibraryRoutes,
      ...RolesRoutes,
      ...PacketRoutes,
      ...TeamsRoutes,
      ...SettingsRoutes,
      ...ProjectsRoutes,
      ...QuestionRoutes,
      ...AtsRoutes,
      ...PricingRoutes,
      ...CandidateRoutes,
      ...AdminRoutes,
      ...HomepageRoutes,
      ...InterviewsRoutes,
      ...QuestionsDownloadRoute,
      ...ReportDownloadRoute,
      ValidateReplyToEmailRoute,
      PageNotFoundRoute,
    ],
  },
  ...SubscriptionRoutes,
  ...ChangePlanRoutes,
  ...IframeableRoutes,
];
 
export default WorkRoute;
