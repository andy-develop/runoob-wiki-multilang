/*!
 * jQuery Quiz 插件（包含样式自动注入）
 * 用法: $('#quiz-container').quiz({ data: quizData });
 */
(function ($) {
    // 插件样式（自动注入到页面）
    var quizStyle = `
.runoob-quiz-container {
    margin: 0 auto;
    padding: 2rem 1rem;
}
.runoob-quiz-header {
    text-align: center;
    margin-bottom: 2rem;
}
.runoob-quiz-header h1 {
    font-size: 1.875rem;
    font-weight: bold;
    color: #64854c;
    margin-bottom: 0.5rem;
}
.runoob-quiz-header p {
    color: #4b5563;
}
.runoob-quiz-card {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 1.5rem;
}
.runoob-quiz-option {
    cursor: pointer;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 2rem;
    font-size: 1.4em;
    margin-bottom: 0.75rem;
    transition: all 0.3s ease;
}
.runoob-quiz-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #64854c;
}
.runoob-quiz-option-content {
    display: flex;
    align-items: center;
}
.runoob-quiz-option-letter {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: #f3f4f6;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.75rem;
}
.runoob-quiz-option.selected .runoob-quiz-option-letter {
    background-color: #64854c;
    color: white;
}
.runoob-quiz-correct {
    background-color: #d1fae5;
    border-color: #64854c;
}
.runoob-quiz-incorrect {
    background-color: #fee2e2;
    border-color: #ef4444;
}
.runoob-quiz-progress-bar {
    background-color: #64854c;
    height: 0.5rem;
    transition: width 0.3s ease-in-out;
}
.runoob-quiz-question-header {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}
.runoob-quiz-question-number {
    background-color: #e0e7ff;
    color: #64854c;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 1em;
    font-weight: 500;
}
.runoob-quiz-question-text {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
}
.runoob-quiz-content {
    padding: 1.5rem;
}
.runoob-quiz-button-container {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
}
.runoob-quiz-btn {
    padding: 0.5rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.3s ease;
}
.runoob-quiz-btn-primary {
    background-color: #64854c;
    color: white;
}
.runoob-quiz-btn-primary:hover {
    background-color: #1d7e09;
}
.runoob-quiz-btn-secondary {
    background-color: #e5e7eb;
    color: #4b5563;
}
.runoob-quiz-btn-secondary:hover {
    background-color: #d1d5db;
}
.runoob-quiz-hidden {
    display: none;
}
.runoob-quiz-result-container {
    text-align: center;
    padding: 2rem 0;
}
.runoob-quiz-score-display {
    font-size: 2.25rem;
    font-weight: bold;
    color: #64854c;
    margin: 1rem 0;
}
.runoob-quiz-result-message {
    color: #4b5563;
    margin-bottom: 1.5rem;
}
.runoob-quiz-explanation {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    margin-top: 1rem;
}
.runoob-quiz-explanation.show {
    max-height: 200px;
    padding: 1rem;
}
.runoob-quiz-explanation h3 {
    color: #374151;
    margin-bottom: 0.5rem;
}
.runoob-quiz-explanation p {
    color: #6b7280;
}
.runoob-quiz-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px);}
    to { opacity: 1; transform: translateY(0);}
}
`;

    // 只注入一次样式
    if (!document.getElementById('runoob-quiz-style')) {
        var styleTag = document.createElement('style');
        styleTag.id = 'runoob-quiz-style';
        styleTag.innerHTML = quizStyle;
        document.head.appendChild(styleTag);
    }

     $.fn.runoobQuiz = function (options) {
        var settings = $.extend({
            data: {},
            onFinish: null
        }, options);

        var $container = $(this);
        var quizData = settings.data;
        var currentQuestionIndex = 0;
        var userAnswers = {};
        var score = 0;

        function initQuiz() {
            currentQuestionIndex = 0;
            userAnswers = {};
            score = 0;
            renderQuestion();
            updateProgressBar();
            $container.siblings('.runoob-quiz-result-container').addClass('runoob-quiz-hidden');
            $container.removeClass('runoob-quiz-hidden');
        }

        function renderQuestion() {
            var question = quizData.questions[currentQuestionIndex];

            var $prevBtn = $container.closest('.runoob-quiz-content').find('#prev-btn');
            var $nextBtn = $container.closest('.runoob-quiz-content').find('#next-btn');
            $prevBtn.toggleClass('runoob-quiz-hidden', currentQuestionIndex === 0);
            $nextBtn.html(currentQuestionIndex === quizData.questions.length - 1 ?
                '提交 <i class="fa fa-check"></i>' :
                '下一题 <i class="fa fa-arrow-right"></i>');

            var optionsHtml = '';
            for (var i = 0; i < question.options.length; i++) {
                var isSelected = userAnswers[currentQuestionIndex] === i;
                var showFeedback = typeof userAnswers[currentQuestionIndex] !== 'undefined';
                var optionClass = "runoob-quiz-option";
                if (showFeedback) {
                    if (i === question.correctIndex) {
                        optionClass += " runoob-quiz-correct";
                    } else if (isSelected) {
                        optionClass += " runoob-quiz-incorrect";
                    }
                }
                if (isSelected) {
                    optionClass += " selected";
                }
                optionsHtml += `
                    <div class="${optionClass}" data-option="${i}">
                        <div class="runoob-quiz-option-content">
                            <div class="runoob-quiz-option-letter ${isSelected ? 'selected' : ''}">
                                ${String.fromCharCode(65 + i)}
                            </div>
                            <span>${question.options[i]}</span>
                            ${showFeedback ?
                    `<span class="feedback-icon">
                        ${i === question.correctIndex ? '<i class="fa fa-check correct-icon"></i>' :
                        (isSelected ? '<i class="fa fa-times incorrect-icon"></i>' : '')}
                    </span>` : ''}
                        </div>
                    </div>
                `;
            }

            // 解析内容
            var showExplanation = typeof userAnswers[currentQuestionIndex] !== 'undefined';
            var explanationClass = showExplanation ? "runoob-quiz-explanation show" : "runoob-quiz-explanation";
            var explanationText = "";
            if (showExplanation) {
                if (userAnswers[currentQuestionIndex] === question.correctIndex) {
                    explanationText = question.correctResponse;
                } else {
                    explanationText = question.incorrectResponse;
                }
            }

            $container.html(`
                <div class="runoob-quiz-fade-in">
                    <div class="runoob-quiz-question-header">
                        <span class="runoob-quiz-question-number">
                            第 ${currentQuestionIndex + 1} 题 / 共 ${quizData.questions.length} 题
                        </span>
                    </div>
                    <h2 class="runoob-quiz-question-text">${question.q}</h2>
                    <div class="runoob-quiz-options-container">
                        ${optionsHtml}
                    </div>
                    <div class="${explanationClass}" id="explanation">
                        <h3 class="explanation-title">
                            <i class="fa fa-info-circle"></i> 解析
                        </h3>
                        <p class="explanation-text">${explanationText}</p>
                    </div>
                </div>
            `);

            $container.find('.runoob-quiz-option').off('click').on('click', function () {
                selectOption(parseInt($(this).data('option')));
            });
        }

        function selectOption(optionIndex) {
            if (typeof userAnswers[currentQuestionIndex] !== 'undefined') {
                return;
            }
            userAnswers[currentQuestionIndex] = optionIndex;
            if (optionIndex === quizData.questions[currentQuestionIndex].correctIndex) {
                score++;
            }
            renderQuestion();
        }

        function updateProgressBar() {
            var $progressBar = $container.closest('.runoob-quiz-card').find('.runoob-quiz-progress-bar');
            var progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
            $progressBar.css('width', progress + '%');
        }

        function showResults() {
            $container.addClass('runoob-quiz-hidden');
            var $resultContainer = $container.closest('.runoob-quiz-content').find('#result-container');
            $resultContainer.removeClass('runoob-quiz-hidden');
            $resultContainer.find('#score-display').text(score + '/' + quizData.questions.length);
            var percentage = (score / quizData.questions.length) * 100;
            var message = "";
            if (percentage >= 80) {
                message = "非常棒！你真的很了解这些知识。";
            } else if (percentage >= 60) {
                message = "不错！你在这个领域有扎实的基础。";
            } else if (percentage >= 40) {
                message = "还可以！再多学习一点会更好。";
            } else {
                message = "继续努力！复习一下内容再试试吧。";
            }
            $resultContainer.find('#result-message').text(message);

            if (typeof settings.onFinish === 'function') {
                settings.onFinish(score, quizData.questions.length);
            }
        }

        $container.closest('.runoob-quiz-content').find('#next-btn').off('click').on('click', function () {
            if (typeof userAnswers[currentQuestionIndex] === 'undefined') {
                alert("请先选择一个答案再继续。");
                return;
            }
            if (currentQuestionIndex < quizData.questions.length - 1) {
                currentQuestionIndex++;
                renderQuestion();
                updateProgressBar();
            } else {
                showResults();
            }
        });

        $container.closest('.runoob-quiz-content').find('#prev-btn').off('click').on('click', function () {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuestion();
                updateProgressBar();
            }
        });

        $container.closest('.runoob-quiz-content').find('#restart-btn').off('click').on('click', function () {
            initQuiz();
        });

        initQuiz();
        return this;
    };
})(jQuery);