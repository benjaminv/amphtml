/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {AmpStoryReaction, ReactionType} from './amp-story-reaction';
import {CSS} from '../../../build/amp-story-reaction-quiz-1.0.css';
import {LocalizedStringId} from '../../../src/localized-strings';
import {createShadowRootWithStyle} from './utils';
import {dev, devAssert} from '../../../src/log';
import {getLocalizationService} from './amp-story-localization-service';
import {htmlFor} from '../../../src/static-template';

/**
 * Generates the template for the quiz.
 *
 * @param {!Element} element
 * @return {!Element}
 */
const buildQuizTemplate = (element) => {
  const html = htmlFor(element);
  return html`
    <div
      class="i-amphtml-story-reaction-quiz-container i-amphtml-story-reaction-container"
    >
      <div class="i-amphtml-story-reaction-quiz-prompt-container"></div>
      <div class="i-amphtml-story-reaction-quiz-option-container"></div>
    </div>
  `;
};

/**
 * Generates the template for each option.
 *
 * @param {!Element} option
 * @return {!Element}
 */
const buildOptionTemplate = (option) => {
  const html = htmlFor(option);
  return html`
    <span
      class="i-amphtml-story-reaction-quiz-option i-amphtml-story-reaction-option"
    >
      <span class="i-amphtml-story-reaction-quiz-answer-choice"></span>
    </span>
  `;
};

export class AmpStoryReactionQuiz extends AmpStoryReaction {
  /**
   * @param {!AmpElement} element
   */
  constructor(element) {
    super(element, ReactionType.QUIZ);

    /** @private {!Array<string>} */
    this.answerChoiceOptions_ = ['A', 'B', 'C', 'D'];

    /** @private {!../../../src/service/localization.LocalizationService} */
    this.localizationService_ = getLocalizationService(element);
  }

  /** @override */
  buildCallback() {
    super.buildCallback();
    createShadowRootWithStyle(
      this.element,
      dev().assertElement(this.rootEl_),
      CSS
    );
  }

  /** @override */
  buildComponent() {
    this.rootEl_ = buildQuizTemplate(this.element);
    this.attachContent_(this.rootEl_);
    return this.rootEl_;
  }

  /**
   * Finds the prompt and options content
   * and adds it to the quiz element.
   *
   * @private
   * @param {Element} root
   */
  attachContent_(root) {
    const promptContainer = root.querySelector(
      '.i-amphtml-story-reaction-quiz-prompt-container'
    );

    if (!this.element.hasAttribute('prompt-text')) {
      this.rootEl_.removeChild(promptContainer);
    } else {
      const prompt = document.createElement('p');

      prompt.textContent = this.element.getAttribute('prompt-text');
      prompt.classList.add('i-amphtml-story-reaction-quiz-prompt');
      promptContainer.appendChild(prompt);
    }

    // Localize the answer choice options
    this.answerChoiceOptions_ = this.answerChoiceOptions_.map((choice) => {
      return this.localizationService_.getLocalizedString(
        LocalizedStringId[`AMP_STORY_QUIZ_ANSWER_CHOICE_${choice}`]
      );
    });
    this.options_.forEach((option, index) =>
      this.configureOption_(option, index)
    );

    devAssert(this.element.children.length == 0, 'Too many children');
  }

  /**
   * Creates an option container with option content,
   * adds styling and answer choices,
   * and adds it to the quiz element.
   *
   * @param {!./amp-story-reaction.OptionConfigType} option
   * @param {number} index
   * @private
   */
  configureOption_(option, index) {
    const convertedOption = buildOptionTemplate(this.element);

    // Fill in the answer choice and set the option ID
    convertedOption.querySelector(
      '.i-amphtml-story-reaction-quiz-answer-choice'
    ).textContent = this.answerChoiceOptions_[index];
    convertedOption.optionIndex_ = option['optionIndex'];

    // Extract and structure the option information
    const optionText = document.createElement('span');
    optionText.classList.add('i-amphtml-story-reaction-quiz-option-text');
    optionText.textContent = option['text'];
    convertedOption.appendChild(optionText);

    // Add text container for percentage display
    const percentageText = document.createElement('span');
    percentageText.classList.add(
      'i-amphtml-story-reaction-quiz-percentage-text'
    );
    convertedOption.appendChild(percentageText);

    if ('correct' in option) {
      convertedOption.setAttribute('correct', 'correct');
    }

    this.rootEl_
      .querySelector('.i-amphtml-story-reaction-quiz-option-container')
      .appendChild(convertedOption);
  }

  /**
   * Get the quiz element
   * @return {Element}
   */
  getQuizElement() {
    return this.rootEl_;
  }

  /**
   * @override
   */
  updateOptionPercentages_(optionsData) {
    if (!optionsData) {
      return;
    }

    const percentages = this.preprocessPercentages_(optionsData);

    percentages.forEach((percentage, index) => {
      // TODO(jackbsteinberg): Add i18n support for various ways of displaying percentages.
      this.getOptionElements()[index].querySelector(
        '.i-amphtml-story-reaction-quiz-percentage-text'
      ).textContent = `${percentage}%`;
    });

    this.rootEl_.setAttribute(
      'style',
      `
      --option-1-percentage: ${percentages[0]}%;
      --option-2-percentage: ${percentages[1]}%;
      --option-3-percentage: ${percentages[2]}%;
      --option-4-percentage: ${percentages[3]}%;
    `
    );
  }
}
