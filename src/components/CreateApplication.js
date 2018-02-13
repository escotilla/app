import React from 'react';
import CreateApplicationForm from './Forms/CreateApplicationForm';

class CreateApplication extends React.Component {
  render() {
    return (
      <div className="col-sm">
        <h2>Let's get started</h2>
        <CreateApplicationForm/>
      </div>
    );
  }
}

export default CreateApplication;