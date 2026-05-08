export default function Main() {
    return (
        <div className="flex justify-start items-stretch bg-[#FFF] w-full h-full overflow-hidden selection:bg-black selection:text-white">

            {/* Column 1 */}
            <div className="flex-1 bg-[#03AED2] h-full overflow-hidden relative flex flex-col items-center justify-center p-8 transition-all duration-500 hover:flex-[1.2] group">
                <div className="relative z-10 text-center">
                    <p className="text-[#F8DE22] font-itim text-3xl md:text-5xl lg:text-3xl mb-2 tracking-tighter drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                        ICE CREAM 1
                    </p>
                    <p className="text-[#FFF] font-itim text-xl md:text-1xl opacity-80 mb-10">
                        VANILLA SKY
                    </p>
                    <button className="flex flex-col items-center group/btn">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[#FFF] font-itim text-lg md:text-xl">More</span>
                            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" className="w-4 h-4 transform transition-transform group-hover/btn:translate-x-1">
                                <path d="M1.6268 9.80859H17.0813M8.67225 17.0813L17.0813 9.80859L8.67225 1.62677" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="w-full h-[2px] bg-white transform scale-x-0 transition-transform group-hover/btn:scale-x-100 origin-left" />
                    </button>
                </div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Column 2 */}
            <div className="flex-1 bg-[#F45B26] h-full overflow-hidden relative flex flex-col items-center justify-center p-8 transition-all duration-500 hover:flex-[1.2] group">
                <div className="relative z-10 text-center">
                    <p className="text-[#F8DE22] font-itim text-4xl md:text-5xl lg:text-3xl mb-2 tracking-tighter drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                        ICE CREAM 2
                    </p>
                    <p className="text-[#000] font-itim text-xl md:text-1xl opacity-70 mb-10">
                        CITRUS BURST
                    </p>
                    <button className="flex flex-col items-center group/btn">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[#000] font-itim text-lg md:text-xl">More</span>
                            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" className="w-4 h-4 transform transition-transform group-hover/btn:translate-x-1">
                                <path d="M1.6268 9.80859H17.0813M8.67225 17.0813L17.0813 9.80859L8.67225 1.62677" stroke="black" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="w-full h-[2px] bg-black transform scale-x-0 transition-transform group-hover/btn:scale-x-100 origin-left" />
                    </button>
                </div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Column 3 */}
            <div className="flex-1 bg-[#F8DE22] h-full overflow-hidden relative flex flex-col items-center justify-center p-8 transition-all duration-500 hover:flex-[1.2] group">
                <div className="relative z-10 text-center">
                    <p className="text-[#F45B26] font-itim text-4xl md:text-5xl lg:text-3xl mb-2 tracking-tighter drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                        ICE CREAM 3
                    </p>
                    <p className="text-[#000] font-itim text-xl md:text-1xl opacity-70 mb-10">
                        GOLDEN HONEY
                    </p>
                    <button className="flex flex-col items-center group/btn">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[#000] font-itim text-lg md:text-xl">More</span>
                            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" className="w-4 h-4 transform transition-transform group-hover/btn:translate-x-1">
                                <path d="M1.6268 9.80859H17.0813M8.67225 17.0813L17.0813 9.80859L8.67225 1.62677" stroke="black" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="w-full h-[2px] bg-black transform scale-x-0 transition-transform group-hover/btn:scale-x-100 origin-left" />
                    </button>
                </div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Column 4 */}
            <div className="flex-1 bg-[#D12052] h-full overflow-hidden relative flex flex-col items-center justify-center p-8 transition-all duration-500 hover:flex-[1.2] group">
                <div className="relative z-10 text-center">
                    <p className="text-[#03AED2] font-itim text-4xl md:text-5xl lg:text-3xl mb-2 tracking-tighter drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                        ICE CREAM 4
                    </p>
                    <p className="text-[#FFF] font-itim text-xl md:text-1xl opacity-80 mb-10">
                        BERRY VELVET
                    </p>
                    <button className="flex flex-col items-center group/btn">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[#FFF] font-itim text-lg md:text-xl">More</span>
                            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" className="w-4 h-4 transform transition-transform group-hover/btn:translate-x-1">
                                <path d="M1.6268 9.80859H17.0813M8.67225 17.0813L17.0813 9.80859L8.67225 1.62677" stroke="white" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="w-full h-[2px] bg-white transform scale-x-0 transition-transform group-hover/btn:scale-x-100 origin-left" />
                    </button>
                </div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

        </div>
    );
}