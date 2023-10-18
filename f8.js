import Cookies from 'js-cookie';
import { ajaxPost } from 'hr-util/ajax';
import { isServer } from 'hr-util/common';
 
import hrMetrics from './hr_metrics';
 
/*** hr metrics extension ***/
function getExtendHrMetrics() {
  if (isServer()) {
    return hrMetrics;
  }
 
  let APP_METRICS = [];
  let lastBatchPending;
  /*** get modules from global scope ***/
  /*
    TODO: This shoudnt come from global scope need to be fixed
   */
  // var mixpanel = window.mixpanel;
  const moment = window.moment;
 
  /*
    TODO: Don't hardcode metrics endpoint instead get it from config
   */
  let metrics_endpoint = 'https://metrics.hackerrank.com/app_metrics';
  if (window.HR && window.HR.development) {
    metrics_endpoint = '/app_metrics';
  }
 
  hrMetrics.externalService = function(event_type, event_value, attrs, service) {
    attrs = typeof attrs !== 'undefined' ? attrs : {};
    attrs['session_id'] = this.get_session_id();
    service = typeof service !== 'undefined' ? service : 'mixpanel:heap';
  };
 
  hrMetrics.app_track = function(key, attrs) {
    const common_attrs = {
      uid: Cookies.get('hackerrank_mixpanel_token'),
    };
 
    APP_METRICS.push({
      key: key,
      meta_data: { ...attrs, ...common_attrs },
    });
 
    if (!lastBatchPending) {
      lastBatchPending = true;
      window.setTimeout(() => {
        lastBatchPending = false;
        hrMetrics._send_app_track_data();
      }, 5000);
    }
  };
 
  hrMetrics._send_app_track_data = function() {
    if (!APP_METRICS.length) {
      return;
    }
    const track_data = {
      data: APP_METRICS,
    };
 
    APP_METRICS = [];
 
    if (typeof moment === 'function' && typeof moment.tz === 'function') {
      track_data['local_timezone'] = moment.tz.guess();
    }
    track_data['default_cdn_url'] = Cookies.get('default_cdn_url');
    track_data['document_referrer'] = document.referrer;
 
    ajaxPost({
      url: metrics_endpoint,
      withCredentials: true,
      data: track_data,
      loadingMessage: {
        onStart: false,
        onError: false,
        onSuccess: false,
      },
    });
  };
 
  hrMetrics.track_dwell_time = function(pathname, use_beacon) {
    if (this._navigation_data && this._navigation_data.page == pathname && this.batch_track) {
      const time_now = new Date().getTime();
      this.batch_track(
        'DwellTime',
        pathname,
        {
          attribute7: parseInt((time_now - (this._navigation_data.time || time_now)) / 1000, 10),
        },
        use_beacon
      );
    }
  };
 
  hrMetrics.set_navigation_data = function(pathname) {
    this._navigation_data = {
      page: pathname || document.location.pathname,
      time: new Date().getTime(),
    };
  };
 
  window.hr_metrics = hrMetrics;
 
  return hrMetrics;
}
 
const hrMetricsExtended = getExtendHrMetrics();
 
export default hrMetricsExtended;
