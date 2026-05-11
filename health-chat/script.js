const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');
const newChatBtn = document.querySelector('.new-chat-btn');
const micBtn = document.getElementById('mic-btn');
const historyList = document.querySelector('.history-list');

// --- Quản lý Sessions (Lịch sử đa luồng) ---
let chatSessions = JSON.parse(localStorage.getItem('healthChatSessions')) || [
    { id: Date.now(), title: 'Cuộc trò chuyện mới', history: [] }
];

// Fallback migration từ phiên bản trước
const oldHistory = JSON.parse(localStorage.getItem('healthChatHistory'));
if (oldHistory && oldHistory.length > 0 && chatSessions[0].history.length === 0) {
    chatSessions[0].history = oldHistory;
    chatSessions[0].title = oldHistory[0].content.substring(0, 20) + '...';
    localStorage.removeItem('healthChatHistory');
}

let currentSessionId = chatSessions[chatSessions.length - 1].id;

function saveSessions() {
    localStorage.setItem('healthChatSessions', JSON.stringify(chatSessions));
    renderSidebar();
}

function getCurrentSession() {
    let session = chatSessions.find(s => s.id === currentSessionId);
    if (!session) {
        session = chatSessions[0];
        currentSessionId = session.id;
    }
    return session;
}

// Lấy nội dung chào mừng mặc định
const defaultWelcomeHtml = `
    <div class="message bot-message">
        <div class="message-icon">
            <i class="fa-solid fa-user-doctor"></i>
        </div>
        <div class="message-content">
            <p>Xin chào! Tôi là trợ lý sức khoẻ AskHealth. Bạn đang cảm thấy thế nào hôm nay? Tôi có thể giúp gì cho bạn?</p>
            <div class="suggestions-container" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;">
                <button class="suggestion-chip" onclick="useSuggestion('Giờ khám bệnh của Bệnh viện Bạch Mai')">🏥 Giờ khám bệnh Bạch Mai</button>
                <button class="suggestion-chip" onclick="useSuggestion('Làm thế nào để giảm đau đầu nhanh chóng do căng thẳng?')">🤕 Cách giảm đau đầu</button>
                <button class="suggestion-chip" onclick="useSuggestion('Gợi ý thực đơn ăn uống cho người bị tiểu đường')">🥗 Thực đơn tiểu đường</button>
                <button class="suggestion-chip" onclick="useSuggestion('Các triệu chứng sớm của bệnh sốt xuất huyết là gì?')">🦟 Triệu chứng sốt xuất huyết</button>
            </div>
        </div>
    </div>
`;

window.useSuggestion = function(text) {
    chatInput.value = text;
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
    chatInput.focus();
    handleSend();
};

function renderSidebar() {
    if (!historyList) return;
    historyList.innerHTML = '';
    // Sắp xếp mới nhất lên đầu
    const sortedSessions = [...chatSessions].sort((a, b) => b.id - a.id);
    
    sortedSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
        item.innerHTML = `<i class="fa-regular fa-message"></i> ${session.title || 'Cuộc trò chuyện mới'}`;
        item.onclick = () => {
            currentSessionId = session.id;
            renderSidebar();
            loadHistory();
        };
        historyList.appendChild(item);
    });
}

// --- Text To Speech (HTML5 Web Speech API) ---
// Tải sẵn danh sách giọng đọc
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

window.speakText = function(btnElement) {
    const textToSpeak = btnElement.getAttribute('data-text');
    if ('speechSynthesis' in window) {
        // Tắt các giọng đang đọc
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        
        // Tìm giọng Tiếng Việt
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(voice => 
            voice.lang === 'vi-VN' || 
            voice.lang.toLowerCase() === 'vi' || 
            voice.name.toLowerCase().includes('vietnamese') ||
            voice.name.toLowerCase().includes('hoaimy') ||
            voice.name.toLowerCase().includes('an')
        );
        
        // Đổi màu icon khi đang đọc
        const icon = btnElement.querySelector('i');
        
        if (viVoice) {
            utterance.voice = viVoice;
            icon.className = 'fa-solid fa-volume-up';
            icon.style.color = 'var(--primary-pink)';
            
            utterance.onend = function() {
                icon.className = 'fa-solid fa-volume-high';
                icon.style.color = 'inherit';
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            // Nếu không có giọng TV thì cảnh báo và KHÔNG đọc, tránh lỗi đọc lơ lớ ra tiếng Thái
            alert("Máy tính của bạn hiện không có sẵn gói Giọng Tiếng Việt (Vietnamese Speech Voice). \n\nĐể hệ thống đọc đúng tiếng Việt, xin vui lòng cài đặt trong Windows (Settings -> Time & Language -> Speech) hoặc ưu tiên sử dụng trình duyệt Google Chrome / Cốc Cốc.");
            icon.className = 'fa-solid fa-volume-high';
            icon.style.color = 'inherit';
        }
    } else {
        alert("Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản!");
    }
};

function renderMessage(content, isUser = false, isMarkdown = false, rawText = "") {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const iconClass = isUser ? 'fa-user' : 'fa-user-doctor';
    
    // Nếu là bot, thêm nút Đọc
    let speakerHtml = "";
    if (!isUser && rawText) {
        // Xóa các ký tự markdown như ** hay # khỏi text đọc
        let cleanTextForSpeech = rawText.replace(/[*#_`]/g, '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        speakerHtml = `<button onclick="speakText(this)" data-text="${cleanTextForSpeech}" class="speaker-btn" title="Đọc văn bản" style="background: none; border: none; cursor: pointer; color: #888; margin-top: 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; transition: color 0.2s;"><i class="fa-solid fa-volume-high"></i> Nghe đọc</button>`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-icon">
            <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="message-content">
            ${isMarkdown ? content : `<p>${content}</p>`}
            ${speakerHtml}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessage(content, isUser = false, isMarkdown = false, rawText = "") {
    renderMessage(content, isUser, isMarkdown, rawText);
    
    const session = getCurrentSession();
    session.history.push({ content, isUser, isMarkdown, rawText });
    
    // Cập nhật title nếu đây là tin nhắn đầu tiên của user
    if (isUser && session.history.length === 1) {
        session.title = content.length > 25 ? content.substring(0, 25) + '...' : content;
    }
    
    saveSessions();
}

function loadHistory() {
    const session = getCurrentSession();
    messagesContainer.innerHTML = '';
    if (session && session.history.length > 0) {
        session.history.forEach(msg => {
            renderMessage(msg.content, msg.isUser, msg.isMarkdown, msg.rawText);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        messagesContainer.innerHTML = defaultWelcomeHtml;
    }
}

// Typings
let typingIndicator = null;
function showTypingIndicator() {
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot-message';
    typingIndicator.innerHTML = `
        <div class="message-icon">
            <i class="fa-solid fa-user-doctor"></i>
        </div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
    }
    typingIndicator = null;
}

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if(this.value.trim() === '') {
        this.style.height = 'auto';
    }
});

async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    const session = getCurrentSession();
    if (session.history.length === 0) {
        messagesContainer.innerHTML = '';
    }
    
    addMessage(text, true);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    const fallbackResponses = [
        "Cảm ơn bạn đã chia sẻ. Hãy nhớ uống đủ nước và duy trì chế độ ăn lành mạnh nhé.",
        "Triệu chứng này có thể do căng thẳng. Bạn nên dành thời gian thư giãn và nghỉ ngơi.",
        "Tôi hiểu sự lo lắng của bạn. Tuy nhiên, nếu tình trạng kéo dài, bạn nên đến gặp bác sĩ chuyên khoa để được thăm khám chi tiết."
    ];

    showTypingIndicator();

    try {
        const response = await fetch("/api/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: text })
        });

        if (response.ok) {
            const data = await response.json();
            
            let finalHtml = "";
            let rawTextToSpeak = data.content_markdown || data.response || data.answer || "Không có nội dung";

            if (data.content_markdown) {
                finalHtml += typeof marked !== 'undefined' ? marked.parse(data.content_markdown) : `<p>${data.content_markdown}</p>`;
            } else {
                finalHtml += `<p>${data.response || data.answer || "Không có nội dung"}</p>`;
            }

            if (data.attachments && data.attachments.length > 0) {
                finalHtml += `<div class="attachments-section" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);">
                                <p style="font-size: 0.85rem; color: #666; margin-bottom: 8px;"><strong>Tài liệu tham khảo:</strong></p>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">`;
                data.attachments.forEach(att => {
                    const icon = att.type === 'pdf' ? 'fa-file-pdf' : 'fa-file';
                    finalHtml += `<a href="${att.url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(79, 195, 247, 0.1); color: #0288d1; border-radius: 16px; text-decoration: none; font-size: 0.85rem;">
                                    <i class="fa-solid ${icon}"></i> File đính kèm (${att.type})
                                  </a>`;
                });
                finalHtml += `</div></div>`;
            }
            
            addMessage(finalHtml, false, true, rawTextToSpeak);
        } else {
            throw new Error("API responded with status: " + response.status);
        }
    } catch (error) {
        console.warn("API Server không phản hồi, tự động chuyển sang cấu hình sẵn (fallback):", error);
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        addMessage(randomResponse, false, false, randomResponse);
    } finally {
        removeTypingIndicator();
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

sendBtn.addEventListener('click', handleSend);

chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Xử lý nút Cuộc trò chuyện mới
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        // Tạo session mới nếu session hiện tại đã có tin nhắn
        if (getCurrentSession().history.length > 0) {
            const newSession = { id: Date.now(), title: 'Cuộc trò chuyện mới', history: [] };
            chatSessions.push(newSession);
            currentSessionId = newSession.id;
            saveSessions();
        }
        loadHistory();
    });
}

// Khởi tạo
window.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    loadHistory();
});

// Nhập liệu bằng giọng nói (Speech-to-Text)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
        micBtn.classList.add('recording');
        chatInput.placeholder = 'Đang nghe...';
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        chatInput.value += (chatInput.value ? ' ' : '') + transcript;
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    };

    recognition.onerror = function(event) {
        console.error('Lỗi nhận diện giọng nói:', event.error);
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            alert('Không thể truy cập Microphone! Vui lòng cắm Mic, kiểm tra thiết bị thu âm hoặc cấp quyền cho trình duyệt.');
        }
    };

    recognition.onend = function() {
        micBtn.classList.remove('recording');
        chatInput.placeholder = 'Nhập câu hỏi về sức khoẻ của bạn...';
        chatInput.focus();
    };

    micBtn.addEventListener('click', () => {
        if (micBtn.classList.contains('recording')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
} else if (micBtn) {
    micBtn.style.display = 'none'; // Ẩn mic nếu trình duyệt không hỗ trợ
}
