class Scrollbar {
    constructor(maxScroll, minScroll) {
        this.scrollBar = document.querySelector('.scroll-bar');
        this.scrollThumb = document.querySelector('.scroll-thumb');
        this.isDragging = false;
        this.startY = 0;
        this.scrollTop = 0;

        this.maxScroll = maxScroll;   
        this.minScroll = minScroll;  
        
        this.startDragging = this.startDragging.bind(this);
        this.stopDragging = this.stopDragging.bind(this);
        this.drag = this.drag.bind(this);

        this.scrollThumb.addEventListener('mousedown', this.startDragging);
        document.addEventListener('mousemove', this.drag);
        document.addEventListener('mouseup', this.stopDragging);
    }

    startDragging(e) {
        this.isDragging = true;
        this.startY = e.pageY;
        this.scrollTop = this.scrollThumb.offsetTop;
    }

    stopDragging() {
        this.isDragging = false;
    }

    drag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        const y = e.pageY;
        const walk = y - this.startY;
        const newPosition = this.scrollTop + walk;

        const maxScroll = this.scrollBar.clientHeight - this.scrollThumb.clientHeight;
        const boundedPosition = Math.max(0, Math.min(newPosition, maxScroll));
        
        this.scrollThumb.style.top = `${boundedPosition}px`;

        const scrollPercent = boundedPosition / maxScroll;
        const cameraY = this.minScroll + (this.maxScroll - this.minScroll) * (1 - scrollPercent);
        
        const scrollEvent = new CustomEvent('customScroll', {
            detail: { targetCameraY: cameraY }
        });
        window.dispatchEvent(scrollEvent);
    }

    updateFromCamera(cameraY) {
        const scrollPercent = 1 - ((cameraY - this.minScroll) / (this.maxScroll - this.minScroll));
        const maxScroll = this.scrollBar.clientHeight - this.scrollThumb.clientHeight;
        const newPosition = maxScroll * scrollPercent;
        this.scrollThumb.style.top = `${newPosition}px`;
    }

    destroy() {
        this.scrollThumb.removeEventListener('mousedown', this.startDragging);
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('mouseup', this.stopDragging);
    }
}

export default Scrollbar;