import React from 'react';
import {NavLink} from 'react-router-dom';
import Language from '../utilities/language';

const checklistConfig = {
  review_profile: {
    path: '/account/profile',
  },
  upload_documents: {
    path: '/account/upload-documents'
  },
  sign_agreement: {
    path: '/account/loan-contract'
  }
};

class Checklist extends React.Component {
  render() {
    const {checklist, language, payloadByPage} = this.props;

    return (
      <div className="list-group">
        <a className="list-group-item list-group-item-action active">
        Todo List
        </a>
        {checklist.map(item => {
          const loading = payloadByPage.hasOwnProperty(item.title) && payloadByPage[item.title].loading;
          const badgeClass = item.status === 'complete' ? 'badge-success' : 'badge-warning';

          return (
            <NavLink
              to={checklistConfig[item.title].path}
              className="list-group-item list-group-item-action justify-content-between align-items-center">
              {Language.get(language, 'checklist.' + item.title)}
              {!loading ? <span className={"badge badge-pill " + badgeClass}>{item.status}</span> : <i className="fa fa-cog fa-spin"/>}
            </NavLink>
          )}
        )}
      </div>
    );
  }
}

export default Checklist;