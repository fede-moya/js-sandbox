//@flow
import React, { Component } from 'react';
import { compose } from 'redux';
import { Link } from 'react-router';
import connectAppUtil from 'app-server/utils/app_util';
 
import type { AppUtil } from 'shared/global.type';
 
import { UserIcon } from 'ui-icons';
import { UploadIcon } from 'ui-icons';
import { Tab } from 'ui-kit';
 
import { getActiveTab } from './admin_util';
 
import './admin.scss';
 
export type State = {
  appUtil: AppUtil,
};
 
class Admin extends Component<Props, State> {
  tabItems() {
    return [
      { title: 'Switch User', to: '/superadmin/su', Icon: UserIcon },
      { title: 'Upload', to: '/superadmin/upload', Icon: UploadIcon },
    ];
  }
 
  tabItemProps = (tab) => ({
    className: 'nav-item',
    'data-analytics': 'AdminDashboardNav',
    'data-attr1': tab.to,
    'data-attr2': tab.title,
  });
 
  renderItem = (tab) => {
    const { to, Icon, title } = tab;
 
    return (
      <Link
        className="nav-item"
        to={to}
        data-analytics="AdminDashboardNav"
        data-attr1={to}
        data-attr2={title}
      >
        <div className="dashboard-nav-item">
          {Icon && <Icon />}
          <span className="ui-icon-label">{title}</span>
        </div>
      </Link>
    );
  };
 
  activeTabIndex = () => {
    const {
      appUtil: { isRouteActive },
    } = this.props;
 
    return getActiveTab(this.tabItems(), isRouteActive);
  };
 
  render() {
    return (
      <div className="admin admin-container container">
        <div className="admin-dashboard">
          <Tab layout="vertical">
            <Tab.List
              tabList={this.tabItems()}
              renderItem={this.renderItem}
              activeTab={this.activeTabIndex()}
            />
            <Tab.Content>{this.props.children}</Tab.Content>
          </Tab>
        </div>
      </div>
    );
  }
}
 
export { Admin as PureAdmin };
 
export default compose(connectAppUtil)(Admin);
