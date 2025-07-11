import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';

@Injectable()
export class GatewayService {
  // POST sin headers
  async forwardPost(url: string, body: any, res: Response) {
    try {
      const response = await axios.post(url, body);
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // POST con token y body
  async forwardPostWithToken(url: string, body: any, token: string, res: Response) {
    try {
      const response = await axios.post(url, body, {
        headers: { Authorization: token },
      });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // POST con token y sin body (para queries)
  async forwardPostWithTokenAndQuery(url: string, token: string, res: Response) {
    try {
      const response = await axios.post(url, {}, {
        headers: { Authorization: token },
      });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // POST con headers personalizados
  async forwardPostWithHeader(url: string, body: any, headers: any, res: Response) {
    try {
      const response = await axios.post(url, body, { headers });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // GET con token
  async forwardGet(url: string, token: string, res: Response) {
    try {
      const response = await axios.get(url, {
        headers: { Authorization: token },
      });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // GET con headers personalizados
  async forwardGetWithHeader(url: string, headers: any, res: Response) {
    try {
      const response = await axios.get(url, { headers });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // DELETE con token
  async forwardDelete(url: string, token: string, res: Response) {
    try {
      const response = await axios.delete(url, {
        headers: { Authorization: token },
      });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // DELETE con headers personalizados
  async forwardDeleteWithHeader(url: string, headers: any, res: Response) {
    try {
      const response = await axios.delete(url, { headers });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // PATCH con token y sin body (para queries) ← NUEVO
  async forwardPatchWithTokenAndQuery(url: string, token: string, res: Response) {
    try {
      const response = await axios.patch(url, {}, {
        headers: { Authorization: token },
      });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }

  // PATCH con headers personalizados
  async forwardPatchWithHeader(url: string, body: any, headers: any, res: Response) {
    try {
      const response = await axios.patch(url, body, { headers });
      return res.status(response.status).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json(error.response?.data || 'Error');
    }
  }
}
