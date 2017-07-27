import React from 'react'
import request from 'request'

export default class PreviewOrLaunchModal extends React.Component {

  constructor(props) {
    super(props)

    this.launchLesson = this.launchLesson.bind(this)
  }

  launchLesson() {
    const {classroomActivityID, lessonUID} = this.props
    request.put({
      url: `${process.env.DEFAULT_URL}/teachers/classroom_activities/${classroomActivityID}/unlock_lesson`,
      json: {authenticity_token: $('meta[name=csrf-token]').attr('content')}
    }, (error, httpStatus, body) => {
      if (body.unlocked) {
        window.location = `http://connect.quill.org/#/teach/class-lessons/${lessonUID}?&classroom_activity_id=${classroomActivityID}`
      }
    })
  }

  render() {
    const {classroomActivityID, lessonUID} = this.props
    return (
      <div>
        <div className="preview-or-launch-modal-background"></div>
        <div className="preview-or-launch-modal">
          <h1>Would you like to preview this lesson?</h1>
          <img alt="close-icon" src="/images/close_icon.svg" onClick={this.props.closeModal}/>
          <p>You can either preview this lesson or launch it, if you are in class with your students now.</p>
          <a href={`http://connect.quill.org/#/teach/class-lessons/${lessonUID}?&classroom_activity_id=${classroomActivityID}`} className="bg-quillgreen">Preview Lesson</a>
          <a onClick={this.launchLesson} className="bg-quillgreen">Launch Lesson</a>
        </div>
      </div>
    )
  }
}