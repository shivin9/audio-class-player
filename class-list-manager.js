/**
 * Class List Manager
 * Handles displaying all classes with individual counters and selection
 */

class ClassListManager {
    constructor() {
        this.selectedClassId = null;
        this.countdownIntervals = {};
        this.init();
    }

    init() {
        this.renderClassList();
        this.startListUpdater();
        this.bindEvents();
    }

    startListUpdater() {
        // Update class list every 30 seconds
        this.updateInterval = setInterval(() => {
            this.renderClassList();
        }, 30000);

        // Update counters every second
        this.counterInterval = setInterval(() => {
            this.updateAllCountdowns();
        }, 1000);
    }

    renderClassList() {
        const container = document.getElementById('classes-container');
        if (!container) return;

        const classes = window.AUDIO_CONFIG.schedule;
        const now = new Date();

        container.innerHTML = '';

        if (classes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h3>📚 No Classes Configured</h3>
                    <p>Please check your configuration file.</p>
                </div>
            `;
            return;
        }

        classes.forEach(classItem => {
            const classCard = this.createClassCard(classItem, now);
            container.appendChild(classCard);
        });

        // Update status
        this.updateMainStatus();
    }

    createClassCard(classItem, now) {
        const startTime = new Date(classItem.startTime);
        const endTime = classItem.endTime ? 
            new Date(classItem.endTime) : 
            new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

        const effectiveStart = startTime.getTime() - bufferTime;
        const effectiveEnd = endTime.getTime() + graceTime;

        // Determine class status
        let status, statusText, buttonText, isClickable;
        
        if (now.getTime() < effectiveStart) {
            status = 'waiting';
            statusText = 'Upcoming';
            buttonText = 'Join When Available';
            isClickable = false;
        } else if (now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd) {
            if (now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime()) {
                status = 'live';
                statusText = 'Live Now';
                buttonText = '🔴 Join Live Class';
                isClickable = true;
            } else {
                status = 'available';
                statusText = 'Available';
                buttonText = '▶️ Join Class';
                isClickable = true;
            }
        } else {
            status = 'ended';
            statusText = 'Ended';
            buttonText = 'Class Ended';
            isClickable = false;
        }

        const card = document.createElement('div');
        card.className = `class-card ${status}`;
        card.dataset.classId = classItem.id;

        card.innerHTML = `
            <div class="class-header">
                <h3 class="class-title">${classItem.title || 'Untitled Class'}</h3>
                <span class="class-status ${status}">${statusText}</span>
            </div>
            
            <div class="class-description">
                ${classItem.description || 'No description available.'}
            </div>
            
            <div class="class-schedule">
                <div class="class-time">
                    📅 ${this.formatDateTime(startTime)}
                    ${classItem.endTime ? ` - ${this.formatTime(endTime)}` : ''}
                </div>
                <div class="class-countdown" data-class-id="${classItem.id}">
                    ${this.getCountdownText(classItem, now)}
                </div>
            </div>
            
            <div class="class-actions">
                <button class="join-class-btn ${status}" 
                        data-class-id="${classItem.id}"
                        ${!isClickable ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;

        if (isClickable) {
            const button = card.querySelector('.join-class-btn');
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectClass(classItem.id);
            });

            card.addEventListener('click', () => {
                this.selectClass(classItem.id);
            });
        }

        return card;
    }

    getCountdownText(classItem, now) {
        const startTime = new Date(classItem.startTime);
        const endTime = classItem.endTime ? 
            new Date(classItem.endTime) : 
            new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

        const effectiveStart = startTime.getTime() - bufferTime;
        const effectiveEnd = endTime.getTime() + graceTime;

        if (now.getTime() < effectiveStart) {
            // Before class - show countdown to start
            const timeLeft = effectiveStart - now.getTime();
            return `Starts in ${this.formatCountdown(timeLeft)}`;
        } else if (now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd) {
            if (now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime()) {
                // During class - show time remaining
                const timeLeft = endTime.getTime() - now.getTime();
                return `⏱️ ${this.formatCountdown(timeLeft)} left`;
            } else {
                // In buffer/grace period
                return '✅ Available Now';
            }
        } else {
            // After class
            return '⏹️ Ended';
        }
    }

    updateAllCountdowns() {
        const now = new Date();
        const countdownElements = document.querySelectorAll('.class-countdown[data-class-id]');
        
        countdownElements.forEach(element => {
            const classId = element.dataset.classId;
            const classItem = window.AUDIO_CONFIG.schedule.find(c => c.id === classId);
            
            if (classItem) {
                element.textContent = this.getCountdownText(classItem, now);
                
                // Update visual state if needed
                const card = element.closest('.class-card');
                const button = card.querySelector('.join-class-btn');
                
                this.updateCardStatus(card, button, classItem, now);
            }
        });
    }

    updateCardStatus(card, button, classItem, now) {
        const startTime = new Date(classItem.startTime);
        const endTime = classItem.endTime ? 
            new Date(classItem.endTime) : 
            new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

        const effectiveStart = startTime.getTime() - bufferTime;
        const effectiveEnd = endTime.getTime() + graceTime;

        // Remove all status classes
        card.classList.remove('waiting', 'available', 'live', 'ended');
        button.classList.remove('waiting', 'available', 'live', 'ended');

        let newStatus, buttonText, isClickable;

        if (now.getTime() < effectiveStart) {
            newStatus = 'waiting';
            buttonText = 'Join When Available';
            isClickable = false;
        } else if (now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd) {
            if (now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime()) {
                newStatus = 'live';
                buttonText = '🔴 Join Live Class';
                isClickable = true;
            } else {
                newStatus = 'available';
                buttonText = '▶️ Join Class';
                isClickable = true;
            }
        } else {
            newStatus = 'ended';
            buttonText = 'Class Ended';
            isClickable = false;
        }

        // Apply new status
        card.classList.add(newStatus);
        button.classList.add(newStatus);
        button.textContent = buttonText;
        button.disabled = !isClickable;

        // Update status badge
        const statusBadge = card.querySelector('.class-status');
        if (statusBadge) {
            statusBadge.className = `class-status ${newStatus}`;
            statusBadge.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
            if (newStatus === 'live') statusBadge.textContent = 'Live Now';
            if (newStatus === 'waiting') statusBadge.textContent = 'Upcoming';
        }
    }

    selectClass(classId) {
        this.selectedClassId = classId;
        const classItem = window.AUDIO_CONFIG.schedule.find(c => c.id === classId);
        
        if (!classItem) {
            console.error('Class not found:', classId);
            return;
        }

        // Check if class is available
        const now = new Date();
        const startTime = new Date(classItem.startTime);
        const endTime = classItem.endTime ? 
            new Date(classItem.endTime) : 
            new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
        const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

        const effectiveStart = startTime.getTime() - bufferTime;
        const effectiveEnd = endTime.getTime() + graceTime;

        if (now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd) {
            // Class is available - go to player
            this.showPlayerForClass(classItem);
        } else if (now.getTime() < effectiveStart) {
            // Class not started yet - go to waiting screen
            this.showWaitingForClass(classItem);
        } else {
            // Class ended
            this.showClassEndedMessage(classItem);
        }
    }

    showPlayerForClass(classItem) {
        // Hide class list, show player
        document.getElementById('class-list-screen').classList.add('hidden');
        document.getElementById('player-screen').classList.remove('hidden');
        document.getElementById('back-to-list-btn').classList.remove('hidden');

        // Update status and pass to scheduler
        document.getElementById('status').textContent = `Playing: ${classItem.title}`;
        
        // Let the scheduler handle the player setup
        if (window.audioScheduler) {
            window.audioScheduler.selectedClassId = classItem.id;
            window.audioScheduler.showPlayerScreen(classItem);
        }
    }

    showWaitingForClass(classItem) {
        // Hide class list, show waiting screen
        document.getElementById('class-list-screen').classList.add('hidden');
        document.getElementById('waiting-screen').classList.remove('hidden');
        document.getElementById('back-to-list-btn').classList.remove('hidden');

        // Update waiting content
        document.getElementById('waiting-class-title').textContent = `Waiting for: ${classItem.title}`;
        document.getElementById('status').textContent = `Waiting for: ${classItem.title}`;

        // Let the scheduler handle the waiting setup
        if (window.audioScheduler) {
            window.audioScheduler.selectedClassId = classItem.id;
            window.audioScheduler.updateWaitingContent(classItem);
            window.audioScheduler.startCountdown(classItem);
        }
    }

    showClassEndedMessage(classItem) {
        // Show a toast message
        if (window.audioPlayerController) {
            window.audioPlayerController.showToast(
                `"${classItem.title}" has already ended. Please check the schedule for upcoming classes.`,
                'warning'
            );
        }
    }

    updateMainStatus() {
        const now = new Date();
        const liveClasses = window.AUDIO_CONFIG.schedule.filter(classItem => {
            const startTime = new Date(classItem.startTime);
            const endTime = classItem.endTime ? 
                new Date(classItem.endTime) : 
                new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
            
            return now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime();
        });

        const availableClasses = window.AUDIO_CONFIG.schedule.filter(classItem => {
            const startTime = new Date(classItem.startTime);
            const endTime = classItem.endTime ? 
                new Date(classItem.endTime) : 
                new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
            const graceTime = window.AUDIO_CONFIG.playerSettings.gracePeriodMinutes * 60 * 1000;

            const effectiveStart = startTime.getTime() - bufferTime;
            const effectiveEnd = endTime.getTime() + graceTime;

            return now.getTime() >= effectiveStart && now.getTime() <= effectiveEnd;
        });

        let statusText;
        if (liveClasses.length > 0) {
            statusText = `🔴 ${liveClasses.length} class${liveClasses.length > 1 ? 'es' : ''} live now`;
        } else if (availableClasses.length > 0) {
            statusText = `✅ ${availableClasses.length} class${availableClasses.length > 1 ? 'es' : ''} available`;
        } else {
            const upcomingClasses = window.AUDIO_CONFIG.schedule.filter(classItem => {
                const startTime = new Date(classItem.startTime);
                const bufferTime = window.AUDIO_CONFIG.playerSettings.bufferTimeMinutes * 60 * 1000;
                return now.getTime() < (startTime.getTime() - bufferTime);
            });

            if (upcomingClasses.length > 0) {
                statusText = `⏰ ${upcomingClasses.length} upcoming class${upcomingClasses.length > 1 ? 'es' : ''}`;
            } else {
                statusText = 'No active classes';
            }
        }

        document.getElementById('status').textContent = statusText;
    }

    formatDateTime(date) {
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        };

        if (window.AUDIO_CONFIG.ui.timeFormat === 24) {
            options.hour12 = false;
        }

        return date.toLocaleDateString('en-US', options);
    }

    formatTime(date) {
        const options = {
            hour: 'numeric',
            minute: '2-digit'
        };

        if (window.AUDIO_CONFIG.ui.timeFormat === 24) {
            options.hour12 = false;
        }

        return date.toLocaleDateString('en-US', options);
    }

    formatCountdown(milliseconds) {
        if (milliseconds <= 0) return '0s';

        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    bindEvents() {
        // Back to list button
        const backButton = document.getElementById('back-to-list-btn');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showClassList();
            });
        }
    }

    showClassList() {
        // Hide other screens
        document.getElementById('waiting-screen').classList.add('hidden');
        document.getElementById('player-screen').classList.add('hidden');
        document.getElementById('ended-screen').classList.add('hidden');
        
        // Show class list
        document.getElementById('class-list-screen').classList.remove('hidden');
        document.getElementById('back-to-list-btn').classList.add('hidden');

        // Reset selected class
        this.selectedClassId = null;
        if (window.audioScheduler) {
            window.audioScheduler.selectedClassId = null;
        }

        // Refresh the list
        this.renderClassList();
    }

    // Public method to refresh the list
    refresh() {
        this.renderClassList();
    }

    // Cleanup method
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.counterInterval) {
            clearInterval(this.counterInterval);
        }
        Object.values(this.countdownIntervals).forEach(interval => {
            clearInterval(interval);
        });
    }
}

// Initialize class list manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.classListManager = new ClassListManager();
    }, 100);
});

// Export for external use
window.ClassListManager = ClassListManager;