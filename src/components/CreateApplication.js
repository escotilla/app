import React from 'react';
import CreateApplicationForm from './Forms/CreateApplicationForm';

class CreateApplication extends React.Component {
  render() {
    return (
      <div className="col-sm">
        <h2>To get started, please provide some details of your business.</h2>
        <CreateApplicationForm/>
      </div>
    );
  }
}

export default CreateApplication;