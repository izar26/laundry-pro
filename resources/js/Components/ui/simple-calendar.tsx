import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addDays,
    eachDayOfInterval,
    isWithinInterval
} from "date-fns";
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { DateRange } from "react-day-picker";

interface SimpleCalendarProps {
    mode?: "single" | "range";
    selected?: Date | DateRange | undefined;
    onSelect?: (date: any) => void;
    className?: string;
    defaultMonth?: Date;
}

export function SimpleCalendar({ mode = "single", selected, onSelect, className, defaultMonth }: SimpleCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(defaultMonth || new Date());
    
    // Handle Range Selection Hover (optional, simplified for now)
    
    const onDateClick = (day: Date) => {
        if (mode === "single") {
            onSelect?.(day);
        } else if (mode === "range") {
            const range = selected as DateRange || {};
            if (range.from && range.to) {
                onSelect?.({ from: day, to: undefined });
            } else if (range.from) {
                if (day < range.from) {
                    onSelect?.({ from: day, to: range.from });
                } else {
                    onSelect?.({ from: range.from, to: day });
                }
            } else {
                onSelect?.({ from: day, to: undefined });
            }
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Header Days
    const daysHeader = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

    // Generate Days
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Check selection helper
    const isSelected = (d: Date) => {
        if (mode === "single") return isSameDay(d, selected as Date);
        if (mode === "range") {
            const range = selected as DateRange;
            if (!range?.from) return false;
            if (isSameDay(d, range.from)) return true;
            if (range.to && isSameDay(d, range.to)) return true;
            if (range.from && range.to && isWithinInterval(d, { start: range.from, end: range.to })) return true;
        }
        return false;
    };

    const isRangeStart = (d: Date) => {
        if (mode !== "range") return false;
        const range = selected as DateRange;
        return range?.from && isSameDay(d, range.from);
    }

    const isRangeEnd = (d: Date) => {
        if (mode !== "range") return false;
        const range = selected as DateRange;
        return range?.to && isSameDay(d, range.to);
    }

    const isRangeMiddle = (d: Date) => {
        if (mode !== "range") return false;
        const range = selected as DateRange;
        return range?.from && range?.to && isWithinInterval(d, { start: range.from, end: range.to }) && !isSameDay(d, range.from) && !isSameDay(d, range.to);
    }

    return (
        <div className={cn("p-3 w-[280px]", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: id })}
                </div>
                <Button variant="outline" size="icon" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2">
                {daysHeader.map((d) => (
                    <div key={d} className="text-center text-[0.8rem] font-normal text-muted-foreground py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((dayItem, idx) => {
                    const isSelectedDay = isSelected(dayItem);
                    const isOutside = !isSameMonth(dayItem, monthStart);
                    const isStart = isRangeStart(dayItem);
                    const isEnd = isRangeEnd(dayItem);
                    const isMiddle = isRangeMiddle(dayItem);

                    let bgClass = "";
                    let textClass = "";
                    let roundedClass = "rounded-md";

                    if (isMiddle) {
                        bgClass = "bg-accent/50";
                        textClass = "text-foreground";
                        roundedClass = "rounded-none";
                    } else if (isStart) {
                        bgClass = "bg-primary text-primary-foreground";
                        textClass = "text-primary-foreground hover:text-primary-foreground";
                        roundedClass = "rounded-l-md rounded-r-none";
                        if (!((selected as DateRange)?.to)) roundedClass = "rounded-md"; // Single select state in range
                    } else if (isEnd) {
                        bgClass = "bg-primary text-primary-foreground";
                        textClass = "text-primary-foreground hover:text-primary-foreground";
                        roundedClass = "rounded-r-md rounded-l-none";
                    } else if (isSelectedDay && mode === "single") {
                        bgClass = "bg-primary text-primary-foreground";
                    }

                    if (isStart && isEnd) roundedClass = "rounded-md";

                    return (
                        <div key={idx} className={cn("p-0 relative", isMiddle && "bg-accent/50", (isStart && (selected as DateRange)?.to) && "bg-accent/50 rounded-l-md", (isEnd) && "bg-accent/50 rounded-r-md")}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "h-8 w-full p-0 font-normal aria-selected:opacity-100 relative z-10",
                                    isOutside && "text-muted-foreground opacity-50",
                                    bgClass,
                                    roundedClass
                                )}
                                onClick={() => onDateClick(dayItem)}
                            >
                                {format(dayItem, "d")}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
