import{u as d,j as e,H as l,L as o}from"./app-Dief6NoF.js";import{Q as p}from"./index-D04FcFK5.js";import{A as c}from"./arrow-left-CT07dr_f.js";import{P as m}from"./printer-D-TVNOvj.js";import"./createLucideIcon-B_IiUr9K.js";function f({employees:r,title:a}){const{app_settings:i}=d().props,n=i?.app_name||"LAUNDRY PRO",s=()=>{window.print()};return e.jsxs("div",{className:"min-h-screen bg-gray-100 flex flex-col items-center py-10 font-sans",children:[e.jsx(l,{title:a}),e.jsxs("div",{className:"mb-6 flex gap-4 print:hidden z-50",children:[e.jsxs(o,{href:route("employees.index"),className:"flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 border border-gray-200",children:[e.jsx(c,{className:"w-4 h-4"})," Kembali"]}),e.jsxs("button",{onClick:s,className:"flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700",children:[e.jsx(m,{className:"w-4 h-4"})," Cetak ",r.length," Kartu"]})]}),e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-8 max-w-[1000px] mx-auto px-4 print:gap-4 print:max-w-none print:px-0 print-grid",children:r.map(t=>e.jsxs("div",{className:"bg-white w-[300px] h-[480px] rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden relative flex flex-col items-center print:shadow-none print:border-gray-500 print-break-inside-avoid",children:[e.jsxs("div",{className:"bg-blue-600 w-full pt-6 pb-12 flex flex-col items-center rounded-b-[50%] relative z-0 print-brand-area print:!bg-blue-600",children:[e.jsx("h1",{className:"text-white text-2xl font-bold tracking-widest drop-shadow-md text-center px-4",children:n.toUpperCase()}),e.jsx("p",{className:"text-blue-200 text-xs mt-1 uppercase tracking-wider",children:"Staff Identity Card"})]}),e.jsx("div",{className:"absolute top-[80px] z-10 w-28 h-28 bg-white rounded-full p-1 shadow-md print:shadow-none print:bg-white print:border-2 print:border-white",children:e.jsx("img",{src:t.user?.avatar?`/storage/${t.user.avatar}`:`https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name||"User")}&background=random&size=150`,alt:"Profile",className:"w-full h-full object-cover rounded-full"})}),e.jsxs("div",{className:"mt-16 text-center w-full px-6 flex-grow flex flex-col justify-between pb-6",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-gray-800 leading-tight",children:t.user?.name||"Unknown"}),e.jsx("p",{className:"text-blue-600 font-medium text-sm mt-1 uppercase tracking-wide",children:t.position||"Staff"}),e.jsxs("p",{className:"text-gray-500 text-xs mt-1",children:["NIP: ",t.nip||"-"]})]}),e.jsxs("div",{className:"flex flex-col items-center mt-4",children:[e.jsx("div",{className:"bg-white p-2 rounded-lg border border-gray-100 shadow-sm inline-block print:shadow-none print:border-gray-300",children:e.jsx(p,{value:t.qr_token||"INVALID",size:110,level:"H",fgColor:"#1f2937"})}),e.jsx("p",{className:"text-[10px] text-gray-400 mt-2 uppercase tracking-wide",children:"Scan for Attendance"})]})]}),e.jsx("div",{className:"h-3 w-full bg-blue-600 print:!bg-blue-600"})]},t.id))}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
                @media print {
                    @page { margin: 0.5cm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: transparent !important; }
                    .print\\:hidden { display: none !important; }
                    .min-h-screen { min-height: auto; padding: 0; display: block; background: transparent; }
                    
                    /* Pastikan kontainer flex berubah menjadi grid 2 kolom 2 baris stabil untuk print */
                    .print-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 0.5cm !important;
                        max-width: 100% !important;
                        margin: 0 auto;
                        justify-items: center;
                    }

                    .print-break-inside-avoid { 
                        break-inside: avoid; 
                        page-break-inside: avoid; 
                        margin-bottom: 0 !important; 
                        transform: scale(0.95);
                        transform-origin: top center;
                    }
                }
            `}})]})}export{f as default};
