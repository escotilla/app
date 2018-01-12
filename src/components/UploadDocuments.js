import React from 'react';
import {connect} from 'react-redux';
import {logout} from '../actions/logout';
import {download} from "../actions/download";
import {updateUserSuccess} from '../actions/login';
import {bindActionCreators} from 'redux'
import Dropzone from 'dropzone';
import {getApiUrl} from '../utilities/environment';

class UploadDocuments extends React.Component {
  componentDidMount() {
    const api_token = this.props.api_token;
    const application_ids = this.props.application_ids;
    const updateUserSuccess = this.props.updateUserSuccess;

    const dz = new Dropzone("div#dropzone", {
      url: getApiUrl() + "/document/create",
      headers: {
        "Cache-Control": "",
        "X-Requested-With": ""
      },
      init: function () {
        this.on("sending", function (file, xhr, formData) {
          formData.append("api_token", api_token);
          formData.append("application_id", application_ids && application_ids.length > 0 ? application_ids[0] : 'bnan');
        });

        this.on("success", function (file, response) {
          if (response.success) {
            updateUserSuccess(response.data);
          }
        });
      }
    });
  }

  render() {
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
          {this.props.uploaded_files && this.props.uploaded_files.length > 0 ?
            this.props.uploaded_files.map(file => {
              return (
                <tr>
                  <td>{file.original_file_name}</td>
                  <td>{Math.floor(file.size / 1000)} kB</td>
                  <td>
                    <i
                      className="fa fa-download fa-2x link"
                      aria-hidden="true"
                      onClick={() => this.props.download({
                        api_token: this.props.api_token,
                        uploaded_file_id: file.uploaded_file_id
                      }, file.original_file_name, file.mime_type)}
                    />
                  </td>
                </tr>
              )
            }) : null}
          </tbody>
        </table>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const {
    user,
  } = state;

  const uploaded_files = user.uploaded_files;
  const api_token = user.api_token;
  const application_ids = user.application_ids;

  return {uploaded_files, api_token, application_ids, user};
};

const mapStateToDispatch = dispatch => {
  return {
    logout: bindActionCreators(logout, dispatch),
    download: bindActionCreators(download, dispatch),
    updateUserSuccess: bindActionCreators(updateUserSuccess, dispatch)
  }
};

export default connect(mapStateToProps, mapStateToDispatch)(UploadDocuments);