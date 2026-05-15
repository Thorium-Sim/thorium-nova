// kiosk-macos.ts
import { dlopen, FFIType, suffix, ptr, type Pointer, JSCallback } from "bun:ffi";

// Load Objective-C runtime
const objc = dlopen(`/usr/lib/libobjc.A.${suffix}`, {
	objc_getClass: {
		args: [FFIType.ptr],
		returns: FFIType.ptr,
	},
	sel_registerName: {
		args: [FFIType.ptr],
		returns: FFIType.ptr,
	},
	objc_msgSend: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.ptr,
	},
});

// Load with different signatures by reopening the library
const objc_uint = dlopen(`/usr/lib/libobjc.A.${suffix}`, {
	objc_msgSend: {
		args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
		returns: FFIType.void,
	},
});

const objc_msgSend_ptr = dlopen(`/usr/lib/libobjc.A.${suffix}`, {
	objc_msgSend: {
		args: [FFIType.ptr, FFIType.ptr],
		returns: FFIType.bool,
	},
});

// Helper function to convert string to C string pointer
function cstr(str: string): Pointer {
	return ptr(Buffer.from(`${str}\0`, "utf-8"));
}

// Helper function to get a class
function getClass(name: string) {
	return objc.symbols.objc_getClass(cstr(name));
}

// Helper function to get a selector
function selector(name: string) {
	return objc.symbols.sel_registerName(cstr(name));
}

export function enableKioskMode(windowHandle: number) {
	const NSThread = getClass("NSThread");
	const isMainThreadSel = selector("isMainThread");

	const isMain = objc_msgSend_ptr.symbols.objc_msgSend(NSThread, isMainThreadSel);
	if (!isMain) {
		throw new Error("Cocoa called off main thread");
	}

	console.log("Enabling kiosk mode for window:", windowHandle);

	// NSWindow constants
	const NSStatusWindowLevel = 25;

	// NSWindowCollectionBehavior flags
	const NSWindowCollectionBehaviorCanJoinAllSpaces = 1 << 0;
	const NSWindowCollectionBehaviorFullScreenPrimary = 1 << 7;

	try {
		console.log("Setting Level");
		// Set window level to status (above menu bar)
		const setLevelSel = selector("setLevel:");
		objc_uint.symbols.objc_msgSend(windowHandle, setLevelSel, NSStatusWindowLevel);
		console.log("Setting collection behavior");
		// Set collection behavior
		const setCollectionBehaviorSel = selector("setCollectionBehavior:");
		const behavior =
			NSWindowCollectionBehaviorCanJoinAllSpaces | NSWindowCollectionBehaviorFullScreenPrimary;
		objc_uint.symbols.objc_msgSend(windowHandle, setCollectionBehaviorSel, behavior);

		// Enter fullscreen
		const toggleFullScreenSel = selector("toggleFullScreen:");
		objc.symbols.objc_msgSend(windowHandle as Pointer, toggleFullScreenSel, null);

		// Get shared NSApplication instance
		const NSApp = getClass("NSApplication");
		const sharedApplicationSel = selector("sharedApplication");
		const app = objc.symbols.objc_msgSend(NSApp, sharedApplicationSel);

		// Set presentation options to hide dock and menu bar
		const setPresentationOptionsSel = selector("setPresentationOptions:");

		// NSApplicationPresentationOptions
		const NSApplicationPresentationHideDock = 1 << 1;
		const NSApplicationPresentationHideMenuBar = 1 << 3;
		const NSApplicationPresentationDisableProcessSwitching = 1 << 5;
		const NSApplicationPresentationDisableForceQuit = 1 << 6;
		const NSApplicationPresentationDisableSessionTermination = 1 << 7;

		const options =
			NSApplicationPresentationHideDock |
			NSApplicationPresentationHideMenuBar |
			NSApplicationPresentationDisableProcessSwitching |
			NSApplicationPresentationDisableForceQuit |
			NSApplicationPresentationDisableSessionTermination;

		objc_uint.symbols.objc_msgSend(app, setPresentationOptionsSel, options);

		console.log("Kiosk mode enabled successfully");
	} catch (error) {
		console.error("Error enabling kiosk mode:", error);
		throw error;
	}
}

export function disableKioskMode(windowHandle: number) {
	try {
		// Get shared NSApplication instance
		const NSApp = getClass("NSApplication");
		const sharedApplicationSel = selector("sharedApplication");
		const app = objc.symbols.objc_msgSend(NSApp, sharedApplicationSel);

		// Reset presentation options
		const setPresentationOptionsSel = selector("setPresentationOptions:");
		objc_uint.symbols.objc_msgSend(app, setPresentationOptionsSel, 0);

		// Exit fullscreen
		const toggleFullScreenSel = selector("toggleFullScreen:");
		objc.symbols.objc_msgSend(windowHandle as Pointer, toggleFullScreenSel, null);

		console.log("Kiosk mode disabled successfully");
	} catch (error) {
		console.error("Error disabling kiosk mode:", error);
		throw error;
	}
}

export function makeFullscreen(windowHandle: number) {
	console.log("Making window fullscreen:", windowHandle);

	try {
		// Check if already in fullscreen
		const styleMaskSel = selector("styleMask");
		const currentStyleMask = objc.symbols.objc_msgSend(windowHandle as Pointer, styleMaskSel);

		// NSWindowStyleMask constants
		const NSWindowStyleMaskFullScreen = 1 << 14;

		// Check if already fullscreen
		const isFullscreen = (Number(currentStyleMask) & NSWindowStyleMaskFullScreen) !== 0;

		if (!isFullscreen) {
			// Toggle fullscreen
			const toggleFullScreenSel = selector("toggleFullScreen:");
			objc.symbols.objc_msgSend(windowHandle as Pointer, toggleFullScreenSel, null);
			console.log("Toggled to fullscreen");
		} else {
			console.log("Window is already fullscreen");
		}
	} catch (error) {
		console.error("Error making window fullscreen:", error);
		throw error;
	}
}

export function exitFullscreen(windowHandle: number) {
	console.log("Exiting fullscreen:", windowHandle);

	try {
		// Check if in fullscreen
		const styleMaskSel = selector("styleMask");
		const currentStyleMask = objc.symbols.objc_msgSend(windowHandle as Pointer, styleMaskSel);

		const NSWindowStyleMaskFullScreen = 1 << 14;
		const isFullscreen = (Number(currentStyleMask) & NSWindowStyleMaskFullScreen) !== 0;

		if (isFullscreen) {
			// Toggle fullscreen to exit
			const toggleFullScreenSel = selector("toggleFullScreen:");
			objc.symbols.objc_msgSend(windowHandle as Pointer, toggleFullScreenSel, null);
			console.log("Exited fullscreen");
		} else {
			console.log("Window is not in fullscreen");
		}
	} catch (error) {
		console.error("Error exiting fullscreen:", error);
		throw error;
	}
}

export function callMainThread() {
	// Load libdispatch which contains GCD functions
	const { symbols } = dlopen("./libdispatch_wrapper.dylib", {
		dispatch_get_main_queue: {
			returns: FFIType.ptr,
			args: [],
		},
		dispatch_async_f: {
			returns: FFIType.void,
			args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
		},
	});

	// Get a reference to the main queue
	const mainQueue = symbols.dispatch_get_main_queue();

	// Create a thread-safe callback that will run on the main thread
	const callback = new JSCallback(
		() => {
			console.log("This is running on the main thread!");
			// Your main-thread code here
		},
		{
			returns: FFIType.void,
			args: [FFIType.ptr],
			threadsafe: true,
		},
	);

	// From your worker thread, dispatch to main:
	symbols.dispatch_async_f(
		mainQueue,
		null, // context pointer
		callback.ptr,
	);

	// Clean up later
	// callback.close();
}
