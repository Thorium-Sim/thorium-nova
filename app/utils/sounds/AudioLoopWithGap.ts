export class AudioLoopWithGap {
	context: AudioContext;
	isPlaying: boolean;
	isFinishing: boolean;
	nextStartTime: number;
	_loop = false;
	loopStart: number;
	loopEnd: number;
	buffer: AudioBuffer;
	loopGap: number;
	playbackRate: number;
	source: AudioBufferSourceNode | null = null;
	connections = new Set<AudioNode>();
	timeout: ReturnType<typeof setTimeout> | undefined;
	onended = () => {};

	constructor(
		audioContext: AudioContext,
		buffer: AudioBuffer,
		options: AudioBufferSourceOptions & { loopGap: number },
	) {
		this.context = audioContext;
		this.isPlaying = false;
		this.isFinishing = false;
		this.buffer = buffer;
		this.nextStartTime = 0;
		this.loopStart = options.loopStart ?? 0;
		this.loopEnd = options.loopEnd ?? this.buffer.duration;
		this.loopGap = options.loopGap ?? 0;
		this.loop = options.loop ?? false;
		this.playbackRate = options.playbackRate ?? 1;
	}

	get cycleDuration() {
		return this.loopEnd - this.loopStart + this.loopGap;
	}

	start(startTime = this.context.currentTime) {
		if (this.isPlaying) return;
		this.isPlaying = true;
		this.nextStartTime = startTime;
		this.scheduleNextLoop(true);
	}

	stop() {
		this.isPlaying = false;
		if (this.source) {
			this.source.stop();
			this.source = null;
		}
	}
	scheduleNextLoop(first?: boolean) {
		if (!this.isPlaying) return;

		// Create and configure the source
		const source = this.context.createBufferSource();
		source.playbackRate.setValueAtTime(this.playbackRate, 0);
		source.onended = this.onended;

		source.buffer = this.buffer;
		for (const connection of this.connections) {
			source.connect(connection);
		}
		if (first) {
			source.start(this.nextStartTime, 0, this.loopEnd);
		} else {
			// Schedule this iteration
			source.start(
				this.nextStartTime,
				this.loopStart,
				this.loopEnd - this.loopStart,
			);
		}
		source.stop(this.nextStartTime + (this.loopEnd - this.loopStart));

		// Store reference to current source
		this.source = source;

		// Calculate next start time (current start time + audio duration + gap)
		this.nextStartTime += this.cycleDuration;

		// Schedule the next iteration slightly before it's needed
		const scheduleAheadTime =
			this.nextStartTime - this.context.currentTime - 0.1;
		if (this.loop) {
			this.timeout = setTimeout(
				() => this.scheduleNextLoop(),
				Math.max(0, scheduleAheadTime * 1000),
			);
		}
	}

	finish() {
		if (!this.isPlaying || this.isFinishing) return;

		this.isFinishing = true;

		// Calculate when the current iteration will end
		const currentLoopEnd = this.nextStartTime - this.loopGap;

		// Create a new source for the final playthrough
		const finalSource = this.context.createBufferSource();
		finalSource.playbackRate.setValueAtTime(this.playbackRate, 0);
		finalSource.buffer = this.buffer;
		finalSource.connect(this.context.destination);

		// Start from loopEnd and play to the end of the buffer
		const remainingDuration = this.buffer.duration - this.loopEnd;
		finalSource.start(currentLoopEnd, this.loopEnd, remainingDuration);

		// Stop looping
		this.isPlaying = false;
	}

	connect(node: AudioNode) {
		this.connections.add(node);
	}
	get loop() {
		return this._loop;
	}
	set loop(newLoop) {
		this._loop = newLoop;
		if (!newLoop) {
			this.finish();
			clearTimeout(this.timeout);
		}
	}
}
