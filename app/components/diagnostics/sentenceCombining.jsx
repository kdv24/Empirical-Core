import React from 'react'
var Markdown = require('react-remarkable');
import {connect} from 'react-redux'
import { Link } from 'react-router'
import Question from '../../libs/question'
import Textarea from 'react-textarea-autosize';
import _ from 'underscore'
import {hashToCollection} from '../../libs/hashToCollection'
import {submitResponse, clearResponses} from '../../actions.js'
import questionActions from '../../actions/questions'
import pathwayActions from '../../actions/pathways'
var C = require("../../constants").default
import rootRef from "../../libs/firebase"
const sessionsRef = rootRef.child('sessions')

import RenderQuestionFeedback from '../renderForQuestions/feedbackStatements.jsx'
import RenderQuestionCues from '../renderForQuestions/cues.jsx'
import RenderSentenceFragments from '../renderForQuestions/sentenceFragments.jsx'
import RenderFeedback from '../renderForQuestions/feedback.jsx'
import generateFeedbackString from '../renderForQuestions/generateFeedbackString.js'
import getResponse from '../renderForQuestions/checkAnswer.js'
import handleFocus from '../renderForQuestions/handleFocus.js'
import submitQuestionResponse from '../renderForQuestions/submitResponse.js'
import updateResponseResource from '../renderForQuestions/updateResponseResource.js'
import submitPathway from '../renderForQuestions/submitPathway.js'

import StateFinished from '../renderForQuestions/renderThankYou.jsx'
import AnswerForm from '../renderForQuestions/renderFormForAnswer.jsx'
import TextEditor from '../renderForQuestions/renderTextEditor.jsx'

const feedbackStrings = {
  punctuationError: "There may be an error. How could you update the punctuation?",
  typingError: "Try again. There may be a spelling mistake.",
  caseError: "Try again. There may be a capitalization error.",
  minLengthError: "Try again. Do you have all of the information from the prompt?",
  maxLengthError: "Try again. How could this sentence be shorter and more concise?"
}

const PlayDiagnosticQuestion = React.createClass({
  getInitialState: function () {
    return {
      editing: false,
      response: "",
      readyForNext: false
    }
  },

  getInitialValue: function () {
    if (this.props.prefill) {
      return this.getQuestion().prefilledText
    }
  },

  removePrefilledUnderscores: function () {
    this.setState({response: this.state.response.replace(/_/g, "")})
  },

  getQuestion: function () {
    return this.props.question
  },

  getResponse2: function (rid) {
    const {data} = this.props.questions, questionID = this.props.question.key;
    return data[questionID].responses[rid]
  },

  submitResponse: function(response) {
    submitQuestionResponse(response,this.props,this.state.sessionKey,submitResponse);
  },

  renderSentenceFragments: function () {
    return <RenderSentenceFragments getQuestion={this.getQuestion}/>
  },

  listCuesAsString: function (cues) {
    var newCues = cues.slice(0);
    return newCues.splice(0, newCues.length - 1).join(", ") + " or " + newCues.pop() + "."
  },

  renderFeedback: function () {
    return <RenderFeedback question={this.props.question} renderFeedbackStatements = {this.renderFeedbackStatements}
            sentence="We have not seen this sentence before. Could you please try writing it in another way?"
            getQuestion={this.getQuestion} listCuesAsString={this.listCuesAsString} />
  },

  getErrorsForAttempt: function (attempt) {
    return _.pick(attempt, 'typingError', 'caseError', 'punctuationError', 'minLengthError', 'maxLengthError')
  },

  renderFeedbackStatements: function (attempt) {
    return <RenderQuestionFeedback attempt={attempt} getErrorsForAttempt={this.getErrorsForAttempt} getQuestion={this.getQuestion}/>
  },

  renderCues: function () {
    return <RenderQuestionCues getQuestion={this.getQuestion}/>
  },

  updateResponseResource: function (response) {
    updateResponseResource(response, this.props, this.getErrorsForAttempt)
  },

  submitPathway: function (response) {
    submitPathway(response, this.props)
  },

  checkAnswer: function (e) {
    this.removePrefilledUnderscores()

    var response = getResponse(this.getQuestion(), this.state.response)
    this.updateResponseResource(response)
    this.submitResponse(response)

    // console.log(this.state)
    this.setState({
      editing: false
    })
  },

  toggleDisabled: function () {
    if (this.state.editing) {
      return "";
    }
    return "is-disabled"
  },

  handleChange: function (e) {
    this.setState({editing: true, response: e})
  },

  readyForNext: function () {
    if (this.props.question.attempts.length > 0 ) {
      var latestAttempt = getLatestAttempt(this.props.question.attempts)
      if (latestAttempt.found) {
        var errors = _.keys(this.getErrorsForAttempt(latestAttempt))
        if (latestAttempt.response.optimal && errors.length === 0) {
          return true
        }
      }
    }
    return false
  },

  getProgressPercent: function () {
    return this.props.question.attempts.length / 3 * 100
  },

  finish: function () {
    this.setState({finished: true})
  },

  nextQuestion: function () {
    console.log("clicking next question");
    this.props.nextQuestion()
    this.setState({response: ""})
  },

  renderNextQuestionButton:  function (correct) {
    if (correct) {
      return (<button className="button is-outlined is-success" onClick={this.nextQuestion}>Next</button>)
    } else {
      return (<button className="button is-outlined is-warning" onClick={this.nextQuestion}>Next</button>)
    }

  },

  render: function () {
    // console.log("in the question.jsx file")
    // console.log(this.props)
    const questionID = this.props.question.key;
    var button;
    // console.log("State: ", this.state)
    if(this.props.question.attempts.length > 0) {
      button = <button className="button is-warning" onClick={this.nextQuestion}>Next</button>
    } else {
      button= <button className="button is-primary" onClick={this.checkAnswer}>Check Answer</button>
    }
    if (this.props.question) {
        // return (
        //   <div className="container">
        //     {this.renderSentenceFragments()}
        //     <TextEditor className="textarea is-question is-disabled" defaultValue={this.getInitialValue()}
        //                 handleChange={this.handleChange} value={this.state.response} getResponse={this.getResponse2}/>
        //     <div className="question-button-group button-group">
        //       {button}
        //     </div>
        //   </div>
        //   // <AnswerForm value={this.state.response} question={this.props.question} getResponse={this.getResponse2} sentenceFragments={this.renderSentenceFragments()} cues={this.renderCues()}
        //   //             feedback={this.renderFeedback()} initialValue={this.getInitialValue()}
        //   //             handleChange={this.handleChange} nextQuestionButton={this.renderNextQuestionButton()}
        //   //             textAreaClass="textarea is-question is-disabled" questionID={questionID}/>
        // )
        return (
          <div className="section container">
            {this.renderSentenceFragments()}
            <h5 className="title is-5">Combine the sentences into one sentence</h5>
            <TextEditor className="textarea is-question is-disabled" defaultValue={this.getInitialValue()}
                        handleChange={this.handleChange} value={this.state.response} getResponse={this.getResponse2}/>
            <div className="question-button-group button-group">
              {button}
            </div>
          </div>
        )
    } else {
      return (<p>Loading...</p>)
    }
  }
})

const getLatestAttempt = function (attempts = []) {
  const lastIndex = attempts.length - 1;
  return attempts[lastIndex]
}

function select(state) {
  return {
    concepts: state.concepts,
    questions: state.questions,
    routing: state.routing
  }
}
export default connect(select)(PlayDiagnosticQuestion)