// backend/src/controllers/departments.controller.js
import { departmentsService } from '../services/departments.service.js';

export const departmentsController = {
  async getDepartments(req, res, next) {
    try {
      const result = await departmentsService.getDepartments(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getDepartmentById(req, res, next) {
    try {
      const dept = await departmentsService.getDepartmentById(req.params.id);
      res.json({ success: true, department: dept });
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(req, res, next) {
    try {
      const dept = await departmentsService.createDepartment(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Tạo phòng ban thành công',
        department: dept,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateDepartment(req, res, next) {
    try {
      const dept = await departmentsService.updateDepartment(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        department: dept,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteDepartment(req, res, next) {
    try {
      const result = await departmentsService.deleteDepartment(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};