import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'underscore';
import { getGradedResponsesWithCallback } from '../../actions/responses.js';
import icon from '../../img/question_icon.svg';
import tooltipChevron from '../../img/tooltipChevron.svg';
import Grader from '../../libs/fillInBlank.js';
import { hashToCollection } from '../../libs/hashToCollection';
import { submitResponse, } from '../../actions/diagnostics.js';
import submitQuestionResponse from '../renderForQuestions/submitResponse.js';
import updateResponseResource from '../renderForQuestions/updateResponseResource.js';
import Cues from '../renderForQuestions/cues.jsx';
import translations from '../../libs/translations/index.js';
import translationMap from '../../libs/translations/ellQuestionMapper.js';

const styles = {
  container: {
    marginTop: 15,
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: 24,
  },
  input: {
    color: '#3D3D3D',
    fontSize: 24,
    marginRight: 10,
    width: 75,
    textAlign: 'center',
    boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.24), 0 0 2px 0 rgba(0, 0, 0, 0.12)',
    borderStyle: 'solid',
    borderWidth: 1,
    borderImageSource: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1) 5%, rgba(255, 255, 255, 0) 20%, rgba(255, 255, 255, 0))',
    borderImageSlice: 1,
  },
  text: {
    marginRight: 10,
  },
};

export class PlayFillInTheBlankQuestion extends Component {
  constructor(props) {
    super(props);
    this.checkAnswer = this.checkAnswer.bind(this);
    this.getQuestion = this.getQuestion.bind(this);
    const q = this.getQuestion();
    const splitPrompt = q.prompt.split('___');
    this.state = {
      splitPrompt,
      inputVals: this.generateInputs(splitPrompt),
      inputErrors: new Set(),
      cues: q.cues,
      blankAllowed: q.blankAllowed,
    };
  }

  componentDidMount() {
    getGradedResponsesWithCallback(
      this.getQuestion().key,
      (data) => {
        this.setState({ responses: data, });
      }
    );
  }

  getQuestion() {
    const { question, } = this.props;
    return question;
  }

  getInstructionText() {
    const textKey = translationMap[this.getQuestion().key];
    let text = `<p>${translations.english[textKey]}</p>`;
    if (this.props.language && this.props.language !== 'english') {
      const textClass = this.props.language === 'arabic' ? 'right-to-left' : '';
      text += `<br/><br/><p class="${textClass}">${translations[this.props.language][textKey]}</p>`;
    }
    return text;
  }

  generateInputs(promptArray) {
    const inputs = [];
    for (let i = 0; i < promptArray.length - 2; i++) {
      inputs.push('');
    }
    return inputs;
  }

  handleChange(i, e) {
    const existing = [...this.state.inputVals];
    existing[i] = e.target.value.trim();
    this.setState({
      inputVals: existing,
    });
  }

  getChangeHandler(index) {
    return (e) => {
      this.handleChange(index, e);
    };
  }

  renderText(text, i) {
    let style = {};
    if (text.length > 0) {
      style = styles.text;
    }
    return <span key={i} style={style}>{text}</span>;
  }

  validateInput(i) {
    const newErrors = new Set(this.state.inputErrors);
    const inputVal = this.state.inputVals[i] || '';
    const inputSufficient = this.state.blankAllowed ? true : inputVal;

    if (!inputSufficient || (inputVal && this.state.cues.indexOf(inputVal.toLowerCase()) === -1)) {
      newErrors.add(i);
    } else {
      newErrors.delete(i);
    }
    this.setState({ inputErrors: newErrors, });
  }

  renderWarning(i) {
    const warningStyle = {
      border: '1px #ff3730 solid',
      color: '#ff3730',
      fontSize: '14px',
      top: '-34px',
      position: 'absolute',
      textAlign: 'center',
      backgroundColor: 'white',
      borderRadius: '3px',
      height: '26px',
      padding: '2px 7px',
    };
    const body = document.getElementsByTagName('body')[0].getBoundingClientRect();
    const rectangle = document.getElementById(`input${i}`).getBoundingClientRect();
    let chevyStyle = this.chevyStyleLeft();
    if (rectangle.left > (body.width / 2)) {
      warningStyle.right = '-73px';
      chevyStyle = this.chevyStyleRight();
    }
    return (
      <div className="warning-dialogue" style={warningStyle} key={`warning${i}`}>
        <span style={{ whiteSpace: 'nowrap', }}>{this.warningText()}</span>
        <img style={chevyStyle} src={tooltipChevron} alt="chevron" />
      </div>
    );
  }

  warningText() {
    const text = 'Uh-oh, try using one of the words below';
    return `${text}${this.state.blankAllowed ? ' or leaving blank.' : '.'}`;
  }

  chevyStyleRight() {
    return {
      float: 'right',
      marginRight: '20px',
      position: 'relative',
      top: '-3px',
    };
  }

  chevyStyleLeft() {
    return {
      float: 'left',
      marginLeft: '20px',
      position: 'relative',
      top: '-3px',
    };
  }

  renderInput(i) {
    let styling = styles.input;
    let warning;
    if (this.state.inputErrors.has(i)) {
      warning = this.renderWarning(i);
      styling = Object.assign({}, styling);
      styling.borderColor = '#ff7370';
      styling.borderWidth = '2px';
      delete styling.borderImageSource;
    }
    return (
      <span key={`span${i}`}>
        <div style={{ position: 'relative', height: 0, width: 0, }}>
          {warning}
        </div>
        <input
          id={`input${i}`}
          key={i + 100}
          style={styling}
          type="text"
          onChange={this.getChangeHandler(i)}
          value={this.state.inputVals[i]}
          onBlur={() => this.validateInput(i)}
        />
      </span>
    );
  }

  getPromptElements() {
    if (this.state.splitPrompt) {
      const { splitPrompt, } = this.state;
      const l = splitPrompt.length;
      const splitPromptWithInput = [];
      splitPrompt.forEach((section, i) => {
        if (i !== l - 1) {
          splitPromptWithInput.push(this.renderText(section, i));
          splitPromptWithInput.push(this.renderInput(i));
        } else {
          splitPromptWithInput.push(this.renderText(section, i));
        }
      });
      return splitPromptWithInput;
    }
  }

  renderPrompt() {
    return (
      <div style={styles.container} >
        {this.getPromptElements()}
      </div>
    );
  }

  zipInputsAndText() {
    const zipped = _.zip(this.state.splitPrompt, this.state.inputVals);
    return _.flatten(zipped).join('');
  }

  checkAnswer() {
    if (!this.state.inputErrors.size) {
      if (!this.state.blankAllowed) {
        if (this.state.inputVals.length === 0) {
          this.validateInput(0);
          return;
        }
      }
      const zippedAnswer = this.zipInputsAndText();
      const fields = {
        prompt: this.getQuestion().prompt,
        responses: hashToCollection(this.state.responses),
        questionUID: this.getQuestion().key,
      };
      const newQuestion = new Grader(fields);
      const response = newQuestion.checkMatch(zippedAnswer);
      this.updateResponseResource(response);
      this.submitResponse(response);
      this.setState({
        response: '',
      });
      this.props.nextQuestion();
    }
  }

  submitResponse(response) {
    submitQuestionResponse(response, this.props, this.state.sessionKey, submitResponse);
  }

  updateResponseResource(response) {
    updateResponseResource(response, this.getQuestion().key, this.getQuestion().attempts, this.props.dispatch);
  }

  renderMedia() {
    if (this.getQuestion().mediaURL) {
      return (
        <div style={{ marginTop: 15, minWidth: 200, }}>
          <img src={this.getQuestion().mediaURL} />
        </div>
      );
    }
  }

  customText() {
    // HARDCODED
    let text = translations.english['add word bank cue'];
    text = `${text}${this.state.blankAllowed ? ' or leave blank' : ''}`;
    if (this.props.language && this.props.language !== 'english') {
      text += ` / ${translations[this.props.language]['add word bank cue']}`;
    }
    return text;
  }

  getSubmitButtonText() {
    let text = translations.english['submit button text'];
    if (this.props.language && this.props.language !== 'english') {
      text += ` / ${translations[this.props.language]['submit button text']}`;
    }
    return text;
  }

  render() {
    return (
      <div className="student-container-inner-diagnostic">
        <div style={{ display: 'flex', }}>
          <div>
            {this.renderPrompt()}
            <Cues getQuestion={this.getQuestion} customText={this.customText()} />
            <div className="feedback-row">
              <img src={icon} alt="icon" style={{ marginTop: 3, }} />
              <div dangerouslySetInnerHTML={{ __html: this.getInstructionText(), }} />
            </div>
          </div>
          {this.renderMedia()}
        </div>
        <div className="question-button-group button-group">
          <button className="button student-submit" onClick={this.checkAnswer}>{this.getSubmitButtonText()}</button>
        </div>
      </div>
    );
  }

}

function select(props) {
  return {
  };
}

export default connect(select)(PlayFillInTheBlankQuestion);