import React, { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { SchoolEvent } from '../types';

interface EventGalleryProps {
    event: SchoolEvent;
    onImageChange: (images: string[]) => void;
}

/**
 * EventGallery Component - Demo Image Upload
 * 
 * Features:
 * - Single image upload (drag & drop or click to select)
 * - Temporary base64 storage
 * - Auto-tagging with event name, staff, and students
 * - Delete functionality
 * 
 * Usage:
 * <EventGallery event={event} onImageChange={(images) => setEvent({...event, galleryImages: images})} />
 */
const EventGallery: React.FC<EventGalleryProps> = ({ event, onImageChange }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            // Store single image as base64 string
            onImageChange([reader.result as string]);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleImageUpload(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const deleteImage = () => {
        onImageChange([]);
    };

    const hasImage = event.galleryImages && event.galleryImages.length > 0;

    return (
        <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ImageIcon size={18} /> Event Gallery
            </h3>

            {!hasImage ? (
                /* Upload Area */
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`h-32 bg-gray-100 rounded-lg border-2 border-dashed ${isDragging ? 'border-school-500 bg-school-50' : 'border-gray-300'
                        } flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors`}
                    onClick={() => document.getElementById('eventImageUpload')?.click()}
                >
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-sm font-medium">
                        {isDragging ? 'Drop photo here' : 'Drag and drop photo here or click to select'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                        (Demo: Single image, temporary storage)
                    </span>
                    <input
                        id="eventImageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                /* Image Preview with Tags */
                <div className="space-y-3">
                    {/* Image */}
                    <div className="relative">
                        <img
                            src={event.galleryImages?.[0] || ''}
                            alt="Event"
                            className="w-full max-h-96 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                            onClick={deleteImage}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg transition-colors"
                            title="Delete image"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Metadata Tags */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="text-xs font-bold text-blue-800 mb-2">📸 Photo Tags</h4>
                        <div className="space-y-1 text-xs text-blue-700">
                            <div>
                                <span className="font-semibold">Event:</span> {event.name}
                            </div>
                            <div>
                                <span className="font-semibold">Staff:</span>{' '}
                                {event.staffRoles?.length > 0
                                    ? event.staffRoles.map(r => r.teacherName).join(', ')
                                    : 'None'}
                            </div>
                            <div>
                                <span className="font-semibold">Students:</span>{' '}
                                {event.studentRoles
                                    .filter(r => r.status === 'participant')
                                    .map(r => r.studentName)
                                    .join(', ') || 'None'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventGallery;
