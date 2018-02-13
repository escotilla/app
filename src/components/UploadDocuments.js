import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {download} from "../actions/download";
import {updateUserSuccess} from '../actions/login';
import {bindActionCreators} from 'redux'
import {getApiUrl} from '../utilities/environment';

class UploadDocuments extends React.Component {
  componentDidMount() {
    const api_token = this.props.api_token;
    const applications = this.props.applications;
    const updateUserSuccess = this.props.updateUserSuccess;

    if (typeof window !== 'undefined') {
      const Dropzone = require('dropzone');
      const dz = new Dropzone("div#dropzone", {
        url: getApiUrl() + "/document/create",
        headers: {
          "Cache-Control": "",
          "X-Requested-With": ""
        },
        init: function () {
          this.on("sending", function (file, xhr, formData) {
            formData.append("api_token", api_token);
            formData.append("application_id", applications && applications.length > 0 ? applications[0].id : 'bnan');
          });

          this.on("success", function (file, response) {
            if (response.success) {
              updateUserSuccess(response.data);
            }
          });
        }
      });
    }
  }

  render() {
    const {isLoading, uploaded_files, download, api_token} = this.props;
    const hasFiles = uploaded_files && uploaded_files.length > 0;

    return (
      <div>
        <h1>Upload Documents page</h1>
        <div className="drop-zone" id="dropzone">
          <div className="dz-message">Drop files here or click to upload.</div>
          <div className="fallback">
            <input name="file" type="file" multiple/>
          </div>
        </div>
        <table className="table table-striped text-center">
          <thead className="thead-dark">
          <tr>
            <th className="text-center">File Name</th>
            <th className="text-center">Size</th>
            <th className="text-center">Download</th>
          </tr>
          </thead>
          <tbody>
          {hasFiles && uploaded_files.map(file => {
              return (
                <tr>
                  <td>{file.original_file_name}</td>
                  <td>{Math.floor(file.size / 1000)} kB</td>
                  <td>
                    <i
                      className="fa fa-download fa-2x link"
                      aria-hidden="true"
                      onClick={() => isLoading ? null : download({
                        api_token: api_token,
                        uploaded_file_id: file.uploaded_file_id
                      }, file.original_file_name, file.mime_type)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
    file
  } = state;

  const uploaded_files = user.uploaded_files;
  const api_token = user.api_token;
  const applications = user.applications;
  const isLoading = file.loading;

  return {uploaded_files, api_token, applications, user, isLoading};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch),
    download: bindActionCreators(download, dispatch),
    updateUserSuccess: bindActionCreators(updateUserSuccess, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(UploadDocuments);