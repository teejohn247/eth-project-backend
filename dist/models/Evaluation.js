"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const EvaluationSchema = new mongoose_1.Schema({
    registrationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Registration', required: true },
    judgeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    auditionDate: { type: Date, required: true },
    scores: {
        talent: { type: Number, min: 0, max: 10 },
        presentation: { type: Number, min: 0, max: 10 },
        creativity: { type: Number, min: 0, max: 10 },
        overall: { type: Number, min: 0, max: 10 }
    },
    totalScore: { type: Number, min: 0, max: 40 },
    feedback: {
        strengths: String,
        areasForImprovement: String,
        generalComments: String
    },
    recommendation: {
        type: String,
        enum: ['advance', 'eliminate', 'callback'],
        required: true
    },
    evaluatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
EvaluationSchema.pre('save', function (next) {
    if (this.scores) {
        const { talent = 0, presentation = 0, creativity = 0, overall = 0 } = this.scores;
        this.totalScore = talent + presentation + creativity + overall;
    }
    next();
});
EvaluationSchema.index({ registrationId: 1 });
EvaluationSchema.index({ judgeId: 1 });
EvaluationSchema.index({ auditionDate: 1 });
EvaluationSchema.index({ totalScore: -1 });
exports.default = mongoose_1.default.model('Evaluation', EvaluationSchema);
//# sourceMappingURL=Evaluation.js.map