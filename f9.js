import React from 'react';
import { shallow } from 'enzyme';
 
import * as ajaxUtils from 'hr-util/ajax';
import { getFakeTimers } from 'test-utils/common';
 
import { getApiUrl } from '../config';
 
import featureFeedbackActions from './feature_feedback_actions';
import { PureFeatureFeedback as FeatureFeedback } from './feature_feedback';
 
const abTest = {
  isVariant(abTestName, variantName) {
    if (abTestName === 'feature-feedback') return true;
  },
};
 
const minProps = {
  feature: {
    feature_name: 'leaderboard',
    heading: 'Like the new Feedback?',
    description:
      'We recently revamped our filters, question navigation to help you. Let us know what you feel about it.',
  },
  apiPrefix: 'rest',
  featureId: 1,
  featureFeedbackActions,
  abTest,
};
 
describe('Test FeatureFeedback', () => {
  it('should render', () => {
    const wrapper = shallow(<FeatureFeedback {...minProps} />);
    jestExpect(wrapper).toHaveLength(1);
  });
 
  it('should render feedback if feature is present & abtest is true', () => {
    const wrapper = shallow(<FeatureFeedback {...minProps} />);
    jestExpect(wrapper.find('.feature-feedback')).toHaveLength(1);
  });
 
  it('should not render feedback if feature is not active', () => {
    const wrapper = shallow(<FeatureFeedback {...minProps} feature={null} />);
    jestExpect(wrapper.find('.feature-feedback')).toHaveLength(0);
  });
 
  it('should not render feedback widget by default', () => {
    const wrapper = shallow(<FeatureFeedback {...minProps} />);
    jestExpect(wrapper.find('.feedback-modal')).toHaveLength(0);
  });
 
  describe('Test Feedback Popover Rendering', () => {
    const wrapper = shallow(<FeatureFeedback {...minProps} />);
 
    it('should show feedback popover on click', () => {
      wrapper.find('.cursor-pointer').simulate('click', { target: '.elm' });
      jestExpect(wrapper.find('Popover')).toHaveLength(1);
    });
 
    it('should hide feedback popover onClose', () => {
      wrapper.instance().onClose();
      wrapper.update();
      jestExpect(wrapper.find('Popover')).toHaveLength(0);
    });
  });
 
  describe('Test FeatureFeedback Methods', () => {
    let wrapper, ajaxPutWithTokenStub, disableFeedbackStub, clock;
 
    beforeEach(() => {
      wrapper = shallow(<FeatureFeedback {...minProps} />);
      wrapper.find('.cursor-pointer').simulate('click', { target: '.elm' });
    });
 
    beforeAll(() => {
      ajaxPutWithTokenStub = sinon.spy(ajaxUtils, 'ajaxPutWithToken');
      disableFeedbackStub = sinon.spy(featureFeedbackActions, 'disable');
      clock = getFakeTimers();
    });
 
    afterAll(() => {
      ajaxPutWithTokenStub.restore();
      disableFeedbackStub.restore();
      clock.restore();
    });
 
    it('should make seenFeedback ajax call on Feedback mount', () => {
      wrapper.instance().onSeen(minProps.featureId);
 
      const seenFeedbackUrl = getApiUrl('seenFeedback', {
        apiPrefix: minProps.apiPrefix,
        id: minProps.featureId,
      });
 
      sinon.assert.calledOnce(ajaxPutWithTokenStub);
      sinon.assert.calledWith(ajaxPutWithTokenStub, {
        loadingMessage: false,
        url: seenFeedbackUrl,
      });
    });
 
    it('should close the feedback popover and disable feature on Feedback Submit', () => {
      wrapper.instance().onSubmit(minProps.featureId);
      clock.tick(10);
      jestExpect(disableFeedbackStub.calledOnce).toBe(false);
      jestExpect(wrapper.find('Popover')).toHaveLength(1);
      clock.tick(3001);
 
      wrapper.update();
      jestExpect(disableFeedbackStub.calledOnce).toBe(true);
      jestExpect(wrapper.find('Popover')).toHaveLength(0);
    });
  });
});
