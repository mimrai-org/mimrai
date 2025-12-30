"use client";
import { useEffect } from "react";

export const useZenModeTimer = () => {
	useEffect(() => {
		const fn = (time: number) => {
			requestAnimationFrame(fn);
		};
		const handle = requestAnimationFrame(fn);
		return () => cancelAnimationFrame(handle);
	}, []);
};
